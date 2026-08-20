-- ============================================================
-- G-ERP Supplier Management — Item workflow and replacement history
-- Phase 3: transactional submit / approve / reject RPCs
-- ============================================================

begin;

alter table public.mdm_item_request
  add column if not exists submission_key text,
  add column if not exists change_type text,
  add column if not exists existing_sub_item_code text references public.mdm_sub_item(sub_item_code),
  add column if not exists replaced_sub_item_code text references public.mdm_sub_item(sub_item_code),
  add column if not exists result_item_code text references public.mdm_item(item_code),
  add column if not exists result_sub_item_code text references public.mdm_sub_item(sub_item_code),
  add column if not exists auto_approved boolean not null default false;

create unique index if not exists uq_mdm_item_request_submission
  on public.mdm_item_request(submission_key)
  where submission_key is not null;

create sequence if not exists public.mdm_item_code_seq start 1;
create sequence if not exists public.mdm_sub_item_code_seq start 1;

create table if not exists public.mdm_sub_item_replacement (
  old_sub_item_code text primary key references public.mdm_sub_item(sub_item_code),
  new_sub_item_code text not null references public.mdm_sub_item(sub_item_code),
  request_no text not null unique references public.mdm_item_request(request_no),
  reason text,
  effective_at timestamptz not null default now(),
  created_by text not null,
  check (old_sub_item_code <> new_sub_item_code)
);
create index if not exists ix_mdm_replacement_new
  on public.mdm_sub_item_replacement(new_sub_item_code);

-- Requests must enter through mdm_submit_item_intake so validation and
-- idempotency cannot be bypassed with a direct table insert.
drop policy if exists mdm_request_insert on public.mdm_item_request;

alter table public.mdm_sub_item_replacement enable row level security;
drop policy if exists mdm_read on public.mdm_sub_item_replacement;
create policy mdm_read on public.mdm_sub_item_replacement
  for select to authenticated using (true);
drop policy if exists mdm_manage on public.mdm_sub_item_replacement;
create policy mdm_manage on public.mdm_sub_item_replacement
  for all to authenticated
  using (public.mdm_can_manage_master())
  with check (public.mdm_can_manage_master());
grant select, insert, update, delete on public.mdm_sub_item_replacement to authenticated;
grant usage, select on sequence public.mdm_item_code_seq to authenticated;
grant usage, select on sequence public.mdm_sub_item_code_seq to authenticated;

create or replace function public.mdm_workflow_domain(value text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(value, '')))
    when 'kỹ thuật' then 'Technical'
    when 'operations' then 'Facilities'
    when '' then 'F&B'
    else btrim(value)
  end;
$$;

create or replace function public.mdm_workflow_physical_fingerprint(
  p_item_code text,
  p_name text,
  p_brand text,
  p_manufacturer text,
  p_purchase_uom text,
  p_conversion_factor numeric,
  p_base_uom text
)
returns text
language sql
immutable
as $$
  select 'G_ERP' || chr(31) || md5(concat_ws(chr(31),
    lower(btrim(coalesce(p_item_code, ''))),
    lower(btrim(coalesce(p_name, ''))),
    lower(btrim(coalesce(p_brand, ''))),
    lower(btrim(coalesce(p_manufacturer, ''))),
    lower(btrim(coalesce(p_purchase_uom, ''))),
    coalesce(p_conversion_factor::text, ''),
    lower(btrim(coalesce(p_base_uom, '')))
  ));
$$;

create or replace function public.mdm_materialize_item_request(p_request_no text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.mdm_item_request%rowtype;
  payload jsonb;
  item_code_value text;
  sub_item_code_value text;
  category_code_value text;
  vendor_code_value text;
  fingerprint_value text;
  request_type_value text;
  image_value text;
  remove_image_value text;
  primary_image_value uuid;
  image_index integer := 0;
  make_primary boolean := false;
begin
  select * into request_row
  from public.mdm_item_request
  where request_no = p_request_no
  for update;

  if not found then raise exception 'Item request % does not exist', p_request_no; end if;
  if request_row.status = 'Rejected' then raise exception 'Rejected request cannot be materialized'; end if;
  if request_row.status = 'Approved' then
    return jsonb_build_object(
      'ok', true,
      'request_no', request_row.request_no,
      'item_code', request_row.result_item_code,
      'sub_item_code', request_row.result_sub_item_code,
      'already_completed', true
    );
  end if;

  payload := coalesce(request_row.proposed_payload, '{}'::jsonb);
  request_type_value := coalesce(request_row.change_type, request_row.request_type, 'Create_Item');
  vendor_code_value := nullif(btrim(payload ->> 'vendor_code'), '');

  if request_type_value in ('Add_Offer', 'Update_Content') then
    sub_item_code_value := coalesce(request_row.existing_sub_item_code, payload ->> 'existing_sub_item_code');
    select item_code into item_code_value
    from public.mdm_sub_item
    where sub_item_code = sub_item_code_value and status = 'Active';
    if item_code_value is null then raise exception 'Active Sub Item is required for %', request_type_value; end if;
  else
    item_code_value := request_row.requested_item_code;
    if item_code_value is not null and not exists (
      select 1 from public.mdm_item where item_code = item_code_value and status = 'Active'
    ) then
      raise exception 'Requested Item % is not active', item_code_value;
    end if;

    if item_code_value is null then
      category_code_value := nullif(btrim(payload ->> 'category_code'), '');
      if category_code_value is null or not exists (
        select 1 from public.mdm_category
        where category_code = category_code_value and status = 'Active'
          and lower(domain) = lower(public.mdm_workflow_domain(request_row.domain))
      ) then raise exception 'An active Category in the requested domain is required for a new Item'; end if;
      item_code_value := 'ITM-' || lpad(nextval('public.mdm_item_code_seq')::text, 8, '0');
      insert into public.mdm_item(
        item_code, domain, category_code, item_name, functional_uom,
        allocation_policy, batch_required, split_allowed, exact_only,
        source_system, review_status, review_note, status
      )
      select
        item_code_value,
        public.mdm_workflow_domain(request_row.domain),
        category_code_value,
        request_row.requested_name,
        payload ->> 'base_uom',
        c.default_allocation,
        c.batch_required,
        not coalesce((payload ->> 'exact_only')::boolean, false),
        coalesce((payload ->> 'exact_only')::boolean, false),
        'G_ERP',
        'Approved',
        'Created by ' || request_row.request_no,
        'Active'
      from public.mdm_category c
      where c.category_code = category_code_value;
    end if;

    fingerprint_value := public.mdm_workflow_physical_fingerprint(
      item_code_value,
      request_row.requested_name,
      payload ->> 'brand',
      payload ->> 'manufacturer',
      payload ->> 'purchase_uom',
      nullif(payload ->> 'conversion_factor', '')::numeric,
      payload ->> 'base_uom'
    );
    select sub_item_code into sub_item_code_value
    from public.mdm_sub_item
    where physical_fingerprint = fingerprint_value;

    if sub_item_code_value is null then
      sub_item_code_value := 'SUB-' || lpad(nextval('public.mdm_sub_item_code_seq')::text, 9, '0');
      insert into public.mdm_sub_item(
        sub_item_code, item_code, sub_item_name, brand, manufacturer,
        purchase_uom, conversion_factor, base_uom, batch_control,
        image_status, status, review_status, source_system, physical_fingerprint
      ) values (
        sub_item_code_value,
        item_code_value,
        request_row.requested_name,
        nullif(payload ->> 'brand', ''),
        nullif(payload ->> 'manufacturer', ''),
        nullif(payload ->> 'purchase_uom', ''),
        nullif(payload ->> 'conversion_factor', '')::numeric,
        nullif(payload ->> 'base_uom', ''),
        false,
        case when jsonb_array_length(coalesce(payload -> 'image_paths', '[]'::jsonb)) > 0 then 'Available' else 'Missing' end,
        'Active',
        'Approved',
        'G_ERP',
        fingerprint_value
      );
    end if;
  end if;

  if request_type_value <> 'Add_Offer' then
    insert into public.mdm_product_content(
      sub_item_code, display_name, brand, manufacturer, pack_description, content_status
    ) values (
      sub_item_code_value,
      request_row.requested_name,
      nullif(payload ->> 'brand', ''),
      nullif(payload ->> 'manufacturer', ''),
      concat_ws(' · ', nullif(payload ->> 'purchase_uom', ''),
        case when nullif(payload ->> 'conversion_factor', '') is not null
          then (payload ->> 'conversion_factor') || ' ' || coalesce(payload ->> 'base_uom', '')
        end),
      case when jsonb_array_length(coalesce(payload -> 'image_paths', '[]'::jsonb)) > 0
        then 'Complete' else 'Needs_Enrichment' end
    )
    on conflict (sub_item_code) do update set
      display_name = excluded.display_name,
      brand = coalesce(excluded.brand, public.mdm_product_content.brand),
      manufacturer = coalesce(excluded.manufacturer, public.mdm_product_content.manufacturer),
      pack_description = coalesce(nullif(excluded.pack_description, ''), public.mdm_product_content.pack_description),
      content_status = case when excluded.content_status = 'Complete' then 'Complete' else public.mdm_product_content.content_status end,
      updated_at = now();
  end if;

  for remove_image_value in select jsonb_array_elements_text(coalesce(payload -> 'remove_image_ids', '[]'::jsonb))
  loop
    update public.mdm_product_image
    set status = 'Inactive', is_primary = false, updated_at = now()
    where image_id = remove_image_value::uuid and sub_item_code = sub_item_code_value;
  end loop;

  primary_image_value := nullif(payload ->> 'primary_image_id', '')::uuid;
  if primary_image_value is not null then
    if not exists (
      select 1 from public.mdm_product_image
      where image_id = primary_image_value and sub_item_code = sub_item_code_value and status = 'Active'
    ) then raise exception 'Selected primary image is not active on this Sub Item'; end if;
    update public.mdm_product_image set is_primary = false, updated_at = now()
    where sub_item_code = sub_item_code_value and is_primary;
    update public.mdm_product_image set is_primary = true, updated_at = now()
    where image_id = primary_image_value;
  end if;

  make_primary := coalesce((payload ->> 'make_image_primary')::boolean, false);
  if make_primary and jsonb_array_length(coalesce(payload -> 'image_paths', '[]'::jsonb)) > 0 then
    update public.mdm_product_image
    set is_primary = false, updated_at = now()
    where sub_item_code = sub_item_code_value and is_primary;
  end if;
  for image_value in select jsonb_array_elements_text(coalesce(payload -> 'image_paths', '[]'::jsonb))
  loop
    image_index := image_index + 1;
    if not exists (
      select 1 from public.mdm_product_image
      where sub_item_code = sub_item_code_value and storage_path = image_value
    ) then
      insert into public.mdm_product_image(
        sub_item_code, storage_path, alt_text, display_order, is_primary, source_system
      ) values (
        sub_item_code_value,
        image_value,
        request_row.requested_name,
        image_index - 1,
        make_primary and image_index = 1,
        'G_ERP'
      );
    end if;
  end loop;
  if not exists (
    select 1 from public.mdm_product_image
    where sub_item_code = sub_item_code_value and status = 'Active' and is_primary
  ) then
    update public.mdm_product_image set is_primary = true, updated_at = now()
    where image_id = (
      select image_id from public.mdm_product_image
      where sub_item_code = sub_item_code_value and status = 'Active'
      order by display_order, created_at limit 1
    );
  end if;
  update public.mdm_sub_item
  set image_status = case when exists (
    select 1 from public.mdm_product_image pi
    where pi.sub_item_code = sub_item_code_value and pi.status = 'Active'
  ) then 'Available' else 'Missing' end,
  updated_at = now()
  where sub_item_code = sub_item_code_value;
  update public.mdm_product_content pc
  set content_status = case when exists (
    select 1 from public.mdm_product_image pi
    where pi.sub_item_code = sub_item_code_value and pi.status = 'Active'
  ) and nullif(btrim(coalesce(pc.brand, '')), '') is not null
    then 'Complete' else 'Needs_Enrichment' end,
  updated_at = now()
  where pc.sub_item_code = sub_item_code_value;

  if vendor_code_value is not null then
    if not exists (select 1 from public.vendor where code = vendor_code_value) then
      raise exception 'Vendor % does not exist', vendor_code_value;
    end if;
    insert into public.mdm_supplier_offer(
      offer_id, sub_item_code, vendor_code, vendor_name,
      purchase_uom, conversion_factor, base_uom, currency,
      status, source_system
    )
    select
      'OFFER-' || upper(substr(md5(sub_item_code_value || chr(31) || vendor_code_value), 1, 20)),
      sub_item_code_value,
      vendor_code_value,
      v.name,
      coalesce(nullif(payload ->> 'purchase_uom', ''), s.purchase_uom),
      coalesce(nullif(payload ->> 'conversion_factor', '')::numeric, s.conversion_factor),
      coalesce(nullif(payload ->> 'base_uom', ''), s.base_uom),
      coalesce(nullif(v.cur, ''), 'VND'),
      'Active',
      'G_ERP'
    from public.vendor v
    join public.mdm_sub_item s on s.sub_item_code = sub_item_code_value
    where v.code = vendor_code_value
    on conflict (sub_item_code, vendor_code) do update set
      vendor_name = excluded.vendor_name,
      purchase_uom = excluded.purchase_uom,
      conversion_factor = excluded.conversion_factor,
      base_uom = excluded.base_uom,
      status = 'Active',
      updated_at = now();
  end if;

  if request_type_value = 'Replace_Sub_Item' then
    if request_row.replaced_sub_item_code is null then raise exception 'Replacement source is required'; end if;
    if not exists (
      select 1 from public.mdm_sub_item
      where sub_item_code = request_row.replaced_sub_item_code
        and item_code = item_code_value and status = 'Active'
    ) then
      raise exception 'Replacement must stay in the same active Item';
    end if;
    insert into public.mdm_sub_item_replacement(
      old_sub_item_code, new_sub_item_code, request_no, reason, created_by
    ) values (
      request_row.replaced_sub_item_code,
      sub_item_code_value,
      request_row.request_no,
      request_row.business_need,
      coalesce(request_row.decided_by, request_row.requester)
    );
    update public.mdm_sub_item set status = 'Inactive', updated_at = now()
    where sub_item_code = request_row.replaced_sub_item_code;
    update public.mdm_supplier_offer set status = 'Inactive', updated_at = now()
    where sub_item_code = request_row.replaced_sub_item_code;
  end if;

  update public.mdm_item_request
  set status = 'Approved',
      result_item_code = item_code_value,
      result_sub_item_code = sub_item_code_value,
      updated_at = now()
  where request_no = request_row.request_no;

  return jsonb_build_object(
    'ok', true,
    'request_no', request_row.request_no,
    'item_code', item_code_value,
    'sub_item_code', sub_item_code_value,
    'request_type', request_type_value
  );
end;
$$;

create or replace function public.mdm_submit_item_intake(
  p_requested_name text,
  p_domain text default 'F&B',
  p_category_code text default null,
  p_item_code text default null,
  p_existing_sub_item_code text default null,
  p_replaced_sub_item_code text default null,
  p_change_type text default null,
  p_brand text default null,
  p_manufacturer text default null,
  p_purchase_uom text default null,
  p_conversion_factor numeric default null,
  p_base_uom text default null,
  p_vendor_code text default null,
  p_supplier_note text default null,
  p_exact_only boolean default false,
  p_image_path text default null,
  p_image_paths text[] default null,
  p_make_image_primary boolean default true,
  p_primary_image_id uuid default null,
  p_remove_image_ids uuid[] default null,
  p_requester text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  request_type_value text;
  request_no_value text;
  owner_value text;
  auto_approved_value boolean := false;
  item_row public.mdm_item%rowtype;
  existing_request public.mdm_item_request%rowtype;
  payload jsonb;
  result jsonb;
  images text[] := coalesce(p_image_paths, array[]::text[]);
begin
  if requester_email = '' then raise exception 'Authentication is required'; end if;
  if not public.mdm_can_submit_intake() then raise exception 'Current role cannot submit Item requests'; end if;
  if p_requester is not null and lower(p_requester) <> requester_email then raise exception 'Requester cannot be spoofed'; end if;
  if nullif(btrim(p_requested_name), '') is null then raise exception 'Requested name is required'; end if;
  if p_image_path is not null and not (p_image_path = any(images)) then images := array_prepend(p_image_path, images); end if;
  if coalesce(array_length(images, 1), 0) > 5 then raise exception 'Maximum 5 images per request'; end if;
  if p_primary_image_id is not null and p_remove_image_ids is not null and p_primary_image_id = any(p_remove_image_ids) then
    raise exception 'Primary image cannot also be removed';
  end if;

  request_type_value := coalesce(nullif(p_change_type, ''),
    case
      when p_replaced_sub_item_code is not null then 'Replace_Sub_Item'
      when p_existing_sub_item_code is not null and p_vendor_code is not null then 'Add_Offer'
      when p_existing_sub_item_code is not null then 'Update_Content'
      when p_item_code is not null then 'Add_Sub_Item'
      else 'Create_Item'
    end);
  if request_type_value not in ('Create_Item', 'Add_Sub_Item', 'Add_Offer', 'Update_Content', 'Replace_Sub_Item') then
    raise exception 'Unsupported change type %', request_type_value;
  end if;
  if request_type_value = 'Create_Item' and not exists (
    select 1 from public.mdm_category
    where category_code = p_category_code and status = 'Active'
      and lower(domain) = lower(public.mdm_workflow_domain(p_domain))
  ) then raise exception 'An active Category in the requested domain is required'; end if;

  if p_item_code is not null then
    select * into item_row from public.mdm_item where item_code = p_item_code and status = 'Active';
    if not found then raise exception 'Active Item % does not exist', p_item_code; end if;
  end if;
  if request_type_value in ('Add_Offer', 'Update_Content') and not exists (
    select 1 from public.mdm_sub_item where sub_item_code = p_existing_sub_item_code and status = 'Active'
  ) then raise exception 'Active Sub Item is required'; end if;
  if request_type_value <> 'Update_Content' and (
    p_primary_image_id is not null or coalesce(array_length(p_remove_image_ids, 1), 0) > 0
  ) then raise exception 'Existing images can only change through Update_Content'; end if;
  if request_type_value = 'Add_Offer' and coalesce(array_length(images, 1), 0) > 0 then
    raise exception 'Add_Offer cannot modify Product Content images';
  end if;
  if request_type_value not in ('Add_Offer', 'Update_Content') then
    if nullif(btrim(p_brand), '') is null then raise exception 'Brand/model is required'; end if;
    if nullif(btrim(p_purchase_uom), '') is null or lower(btrim(p_purchase_uom)) in ('gr', 'ml') then
      raise exception 'Purchase UOM is invalid';
    end if;
    if p_conversion_factor is null or p_conversion_factor <= 0 then raise exception 'Conversion factor must be greater than zero'; end if;
    if nullif(btrim(p_base_uom), '') is null then raise exception 'Base UOM is required'; end if;
    if item_row.item_code is not null and lower(item_row.functional_uom) <> lower(btrim(p_base_uom)) then
      raise exception 'Base UOM must match Item functional UOM %', item_row.functional_uom;
    end if;
  end if;
  if p_vendor_code is not null and not exists (select 1 from public.vendor where code = p_vendor_code) then
    raise exception 'Vendor % does not exist', p_vendor_code;
  end if;
  if request_type_value = 'Add_Offer' and exists (
    select 1 from public.mdm_supplier_offer
    where sub_item_code = p_existing_sub_item_code and vendor_code = p_vendor_code and status = 'Active'
  ) then raise exception 'An active offer already exists for this Vendor and Sub Item'; end if;

  auto_approved_value := (
    request_type_value = 'Add_Sub_Item'
    and item_row.item_code is not null
    and not coalesce(p_exact_only, false)
    and lower(item_row.domain) = lower(public.mdm_workflow_domain(p_domain))
    and lower(item_row.functional_uom) = lower(btrim(p_base_uom))
    and not exists (
      select 1 from public.mdm_sub_item existing_sub
      where existing_sub.physical_fingerprint = public.mdm_workflow_physical_fingerprint(
        p_item_code, p_requested_name, p_brand, p_manufacturer,
        p_purchase_uom, p_conversion_factor, p_base_uom
      )
    )
  ) or (
    request_type_value = 'Add_Offer'
    and p_existing_sub_item_code is not null
    and p_vendor_code is not null
  );

  if p_idempotency_key is not null then
    select * into existing_request
    from public.mdm_item_request
    where submission_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'request_no', existing_request.request_no,
        'auto_approved', existing_request.auto_approved,
        'item_code', existing_request.result_item_code,
        'sub_item_code', existing_request.result_sub_item_code,
        'status', existing_request.status,
        'idempotent_replay', true
      );
    end if;
  end if;

  owner_value := case
    when auto_approved_value then 'System'
    when request_type_value = 'Replace_Sub_Item' then 'MDM Approver'
    when public.mdm_workflow_domain(p_domain) = 'Technical' then 'Technical Owner'
    else 'Category Owner'
  end;
  payload := jsonb_build_object(
    'category_code', nullif(btrim(p_category_code), ''),
    'brand', nullif(btrim(p_brand), ''),
    'manufacturer', nullif(btrim(p_manufacturer), ''),
    'purchase_uom', nullif(btrim(p_purchase_uom), ''),
    'conversion_factor', p_conversion_factor,
    'base_uom', nullif(btrim(p_base_uom), ''),
    'vendor_code', nullif(btrim(p_vendor_code), ''),
    'supplier_note', nullif(btrim(p_supplier_note), ''),
    'exact_only', coalesce(p_exact_only, false),
    'existing_sub_item_code', p_existing_sub_item_code,
    'replaced_sub_item_code', p_replaced_sub_item_code,
    'image_paths', to_jsonb(images),
    'make_image_primary', coalesce(p_make_image_primary, true),
    'primary_image_id', p_primary_image_id,
    'remove_image_ids', to_jsonb(coalesce(p_remove_image_ids, array[]::uuid[]))
  );

  insert into public.mdm_item_request(
    request_type, requested_name, business_need, domain,
    requested_item_code, proposed_payload, image_path, requester,
    current_owner, status, submission_key, change_type,
    existing_sub_item_code, replaced_sub_item_code, auto_approved
  ) values (
    request_type_value, btrim(p_requested_name), p_supplier_note,
    public.mdm_workflow_domain(p_domain), p_item_code, payload,
    images[1], requester_email, owner_value,
    case when auto_approved_value then 'Submitted' else 'Pending_Review' end,
    coalesce(p_idempotency_key, gen_random_uuid()::text), request_type_value,
    p_existing_sub_item_code, p_replaced_sub_item_code, auto_approved_value
  ) returning request_no into request_no_value;

  if auto_approved_value then
    result := public.mdm_materialize_item_request(request_no_value);
  else
    result := jsonb_build_object('ok', true, 'request_no', request_no_value, 'current_owner', owner_value);
  end if;
  return result || jsonb_build_object(
    'request_no', request_no_value,
    'auto_approved', auto_approved_value,
    'current_owner', owner_value
  );
exception when unique_violation then
  if p_idempotency_key is null then raise; end if;
  select * into existing_request from public.mdm_item_request where submission_key = p_idempotency_key;
  return jsonb_build_object(
    'request_no', existing_request.request_no,
    'auto_approved', existing_request.auto_approved,
    'item_code', existing_request.result_item_code,
    'sub_item_code', existing_request.result_sub_item_code,
    'status', existing_request.status,
    'idempotent_replay', true
  );
end;
$$;

create or replace function public.mdm_approve_request(
  p_request_no text,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.mdm_item_request%rowtype;
  approver_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  result jsonb;
begin
  if approver_email = '' then raise exception 'Authentication is required'; end if;
  if not public.mdm_can_manage_master() then raise exception 'Only Admin/Approver can decide Item requests'; end if;
  if lower(p_decision) not in ('approve', 'reject') then raise exception 'Decision must be approve or reject'; end if;

  select * into request_row from public.mdm_item_request
  where request_no = p_request_no for update;
  if not found then raise exception 'Item request % does not exist', p_request_no; end if;
  if request_row.status in ('Approved', 'Rejected', 'Cancelled') then
    return jsonb_build_object('ok', true, 'request_no', p_request_no, 'status', request_row.status, 'already_completed', true);
  end if;

  update public.mdm_item_request
  set decision_note = nullif(btrim(p_note), ''),
      decided_by = approver_email,
      decided_at = now(),
      updated_at = now()
  where request_no = p_request_no;

  if lower(p_decision) = 'reject' then
    if nullif(btrim(p_note), '') is null then raise exception 'Rejection reason is required'; end if;
    update public.mdm_item_request set status = 'Rejected', updated_at = now()
    where request_no = p_request_no;
    return jsonb_build_object('ok', true, 'request_no', p_request_no, 'status', 'Rejected');
  end if;

  result := public.mdm_materialize_item_request(p_request_no);
  return result || jsonb_build_object('decision', 'Approved');
end;
$$;

revoke all on function public.mdm_materialize_item_request(text) from public;
revoke all on function public.mdm_submit_item_intake(text, text, text, text, text, text, text, text, text, text, numeric, text, text, text, boolean, text, text[], boolean, uuid, uuid[], text, text) from public;
revoke all on function public.mdm_approve_request(text, text, text) from public;
grant execute on function public.mdm_submit_item_intake(text, text, text, text, text, text, text, text, text, text, numeric, text, text, text, boolean, text, text[], boolean, uuid, uuid[], text, text) to authenticated;
grant execute on function public.mdm_approve_request(text, text, text) to authenticated;

commit;
