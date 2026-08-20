-- ============================================================
-- G-ERP Supplier Management — downstream integration boundary
-- Phase 4: crosswalk, transactional outbox, retry and audit
-- No NAV2017/Vista credential or HTTP call is stored in the database.
-- ============================================================

begin;

create table if not exists public.mdm_downstream_field_mapping (
  target_system text not null check (target_system in ('NAV2017', 'VISTA')),
  entity_type text not null check (entity_type in ('Item', 'Sub_Item')),
  canonical_field text not null,
  external_field text not null,
  required boolean not null default false,
  transform_rule text not null default 'identity',
  sync_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (target_system, entity_type, canonical_field)
);

create table if not exists public.mdm_downstream_crosswalk (
  target_system text not null check (target_system in ('NAV2017', 'VISTA')),
  entity_type text not null check (entity_type in ('Item', 'Sub_Item')),
  canonical_code text not null,
  external_id text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Verified', 'Blocked', 'Inactive')),
  note text,
  verified_at timestamptz,
  verified_by text,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (target_system, entity_type, canonical_code)
);
create unique index if not exists uq_mdm_crosswalk_external_active
  on public.mdm_downstream_crosswalk(target_system, entity_type, external_id)
  where status <> 'Inactive';
create index if not exists ix_mdm_crosswalk_status
  on public.mdm_downstream_crosswalk(target_system, status, entity_type);

create table if not exists public.mdm_downstream_outbox (
  event_id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  request_no text not null references public.mdm_item_request(request_no),
  target_system text not null check (target_system in ('NAV2017', 'VISTA')),
  entity_type text not null check (entity_type in ('Item', 'Sub_Item')),
  canonical_code text not null,
  external_id text,
  operation text not null check (operation in ('Upsert', 'Deactivate')),
  schema_version text not null default '1.0',
  payload jsonb not null,
  payload_hash text not null,
  status text not null default 'Pending'
    check (status in ('Pending', 'Processing', 'Synced', 'Failed', 'Blocked')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  response_payload jsonb,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_mdm_outbox_dispatch
  on public.mdm_downstream_outbox(target_system, status, next_attempt_at, created_at);
create index if not exists ix_mdm_outbox_canonical
  on public.mdm_downstream_outbox(target_system, entity_type, canonical_code, created_at desc);

create table if not exists public.mdm_downstream_sync_audit (
  audit_id bigint generated always as identity primary key,
  event_id uuid references public.mdm_downstream_outbox(event_id) on delete set null,
  action text not null,
  actor text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ix_mdm_sync_audit_event
  on public.mdm_downstream_sync_audit(event_id, created_at desc);

drop trigger if exists trg_mdm_downstream_field_mapping_touch on public.mdm_downstream_field_mapping;
create trigger trg_mdm_downstream_field_mapping_touch
  before update on public.mdm_downstream_field_mapping
  for each row execute function public.touch_updated();
drop trigger if exists trg_mdm_downstream_crosswalk_touch on public.mdm_downstream_crosswalk;
create trigger trg_mdm_downstream_crosswalk_touch
  before update on public.mdm_downstream_crosswalk
  for each row execute function public.touch_updated();
drop trigger if exists trg_mdm_downstream_outbox_touch on public.mdm_downstream_outbox;
create trigger trg_mdm_downstream_outbox_touch
  before update on public.mdm_downstream_outbox
  for each row execute function public.touch_updated();

insert into public.mdm_downstream_field_mapping
  (target_system, entity_type, canonical_field, external_field, required, transform_rule, sync_order)
values
  ('NAV2017', 'Item', 'item_code', 'No', true, 'identity', 10),
  ('NAV2017', 'Item', 'item_name', 'Description', true, 'trim_100', 20),
  ('NAV2017', 'Item', 'functional_uom', 'Base_Unit_of_Measure', true, 'uom_crosswalk', 30),
  ('NAV2017', 'Item', 'category_code', 'Item_Category_Code', true, 'identity', 40),
  ('NAV2017', 'Item', 'allocation_policy', 'Allocation_Policy', false, 'identity', 50),
  ('NAV2017', 'Sub_Item', 'sub_item_code', 'Variant_Code', true, 'identity', 10),
  ('NAV2017', 'Sub_Item', 'item_code', 'Item_No', true, 'crosswalk', 20),
  ('NAV2017', 'Sub_Item', 'purchase_uom', 'Purchase_Unit_of_Measure', true, 'uom_crosswalk', 30),
  ('NAV2017', 'Sub_Item', 'conversion_factor', 'Qty_per_Unit_of_Measure', true, 'decimal', 40),
  ('NAV2017', 'Sub_Item', 'base_uom', 'Base_Unit_of_Measure', true, 'uom_crosswalk', 50),
  ('VISTA', 'Item', 'item_code', 'HOItemCode', true, 'identity', 10),
  ('VISTA', 'Item', 'item_name', 'ItemName', true, 'trim_100', 20),
  ('VISTA', 'Item', 'category_code', 'CategoryCode', true, 'identity', 30),
  ('VISTA', 'Item', 'functional_uom', 'BaseUOM', true, 'uom_crosswalk', 40),
  ('VISTA', 'Sub_Item', 'sub_item_code', 'HOSubItemCode', true, 'identity', 10),
  ('VISTA', 'Sub_Item', 'item_code', 'HOItemCode', true, 'identity', 20),
  ('VISTA', 'Sub_Item', 'brand', 'Brand', false, 'trim_100', 30),
  ('VISTA', 'Sub_Item', 'manufacturer', 'Manufacturer', false, 'trim_100', 40),
  ('VISTA', 'Sub_Item', 'purchase_uom', 'PurchaseUOM', true, 'uom_crosswalk', 50),
  ('VISTA', 'Sub_Item', 'conversion_factor', 'ConversionFactor', true, 'decimal', 60),
  ('VISTA', 'Sub_Item', 'base_uom', 'BaseUOM', true, 'uom_crosswalk', 70)
on conflict (target_system, entity_type, canonical_field) do update set
  external_field = excluded.external_field,
  required = excluded.required,
  transform_rule = excluded.transform_rule,
  sync_order = excluded.sync_order,
  active = true,
  updated_at = now();

create or replace function public.mdm_build_downstream_payload(
  p_target_system text,
  p_entity_type text,
  p_canonical_code text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  payload jsonb;
  target_value text := upper(btrim(coalesce(p_target_system, '')));
begin
  if target_value not in ('NAV2017', 'VISTA') then raise exception 'Unsupported target system'; end if;
  if p_entity_type = 'Item' then
    select jsonb_build_object(
      'schema_version', '1.0',
      'source_system', 'G_ERP',
      'target_system', target_value,
      'entity_type', 'Item',
      'canonical_code', i.item_code,
      'status', i.status,
      'data', jsonb_build_object(
        'item_code', i.item_code,
        'item_name', i.item_name,
        'domain', i.domain,
        'category_code', i.category_code,
        'functional_uom', i.functional_uom,
        'allocation_policy', i.allocation_policy,
        'batch_required', i.batch_required,
        'split_allowed', i.split_allowed,
        'exact_only', i.exact_only
      )
    ) into payload
    from public.mdm_item i where i.item_code = p_canonical_code;
  elsif p_entity_type = 'Sub_Item' then
    select jsonb_build_object(
      'schema_version', '1.0',
      'source_system', 'G_ERP',
      'target_system', target_value,
      'entity_type', 'Sub_Item',
      'canonical_code', s.sub_item_code,
      'status', s.status,
      'data', jsonb_build_object(
        'sub_item_code', s.sub_item_code,
        'item_code', s.item_code,
        'sub_item_name', s.sub_item_name,
        'brand', s.brand,
        'manufacturer', s.manufacturer,
        'purchase_uom', s.purchase_uom,
        'conversion_factor', s.conversion_factor,
        'base_uom', s.base_uom,
        'gtin', s.gtin,
        'country_of_origin', s.country_of_origin,
        'image_status', s.image_status
      ),
      'offers', coalesce((
        select jsonb_agg(jsonb_build_object(
          'offer_id', o.offer_id,
          'vendor_code', o.vendor_code,
          'purchase_uom', o.purchase_uom,
          'conversion_factor', o.conversion_factor,
          'base_uom', o.base_uom,
          'currency', o.currency,
          'status', o.status,
          'locations', coalesce((
            select jsonb_agg(l.location_code order by l.location_code)
            from public.mdm_supplier_offer_location l where l.offer_id = o.offer_id
          ), '[]'::jsonb)
        ) order by o.offer_id)
        from public.mdm_supplier_offer o where o.sub_item_code = s.sub_item_code
      ), '[]'::jsonb)
    ) into payload
    from public.mdm_sub_item s where s.sub_item_code = p_canonical_code;
  else
    raise exception 'Unsupported entity type %', p_entity_type;
  end if;
  if payload is null then raise exception '% % does not exist', p_entity_type, p_canonical_code; end if;
  return payload;
end;
$$;

create or replace function public.mdm_enqueue_downstream_entity(
  p_request_no text,
  p_target_system text,
  p_entity_type text,
  p_canonical_code text,
  p_operation text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id_value uuid;
  external_id_value text;
  payload_value jsonb;
  status_value text;
  event_key_value text;
begin
  if p_operation not in ('Upsert', 'Deactivate') then raise exception 'Unsupported operation'; end if;
  select external_id into external_id_value
  from public.mdm_downstream_crosswalk
  where target_system = p_target_system
    and entity_type = p_entity_type
    and canonical_code = p_canonical_code
    and status = 'Verified';
  status_value := case when external_id_value is null then 'Blocked' else 'Pending' end;
  payload_value := public.mdm_build_downstream_payload(p_target_system, p_entity_type, p_canonical_code);
  event_key_value := concat_ws(':', p_target_system, p_entity_type, p_canonical_code, p_request_no, p_operation);

  insert into public.mdm_downstream_outbox(
    event_key, request_no, target_system, entity_type, canonical_code,
    external_id, operation, payload, payload_hash, status, last_error
  ) values (
    event_key_value, p_request_no, p_target_system, p_entity_type, p_canonical_code,
    external_id_value, p_operation, payload_value, md5(payload_value::text), status_value,
    case when external_id_value is null then 'Verified crosswalk is required before dispatch' end
  )
  on conflict (event_key) do nothing
  returning event_id into event_id_value;

  if event_id_value is not null then
    insert into public.mdm_downstream_sync_audit(event_id, action, actor, detail)
    values (
      event_id_value,
      case when status_value = 'Blocked' then 'Enqueued_Blocked' else 'Enqueued' end,
      'SYSTEM',
      jsonb_build_object('request_no', p_request_no, 'payload_hash', md5(payload_value::text))
    );
  end if;
  return event_id_value;
end;
$$;

create or replace function public.mdm_enqueue_downstream(p_request_no text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.mdm_item_request%rowtype;
  target_value text;
  event_value uuid;
  event_count integer := 0;
begin
  select * into request_row from public.mdm_item_request where request_no = p_request_no;
  if not found then raise exception 'Item request % does not exist', p_request_no; end if;
  if request_row.status <> 'Approved' then raise exception 'Only Approved requests can be enqueued'; end if;

  foreach target_value in array array['NAV2017', 'VISTA'] loop
    if request_row.result_item_code is not null and exists (
      select 1 from public.mdm_item where item_code = request_row.result_item_code and status = 'Active'
    ) then
      event_value := public.mdm_enqueue_downstream_entity(
        request_row.request_no, target_value, 'Item', request_row.result_item_code, 'Upsert'
      );
      if event_value is not null then event_count := event_count + 1; end if;
    end if;
    if request_row.result_sub_item_code is not null and exists (
      select 1 from public.mdm_sub_item where sub_item_code = request_row.result_sub_item_code and status = 'Active'
    ) then
      event_value := public.mdm_enqueue_downstream_entity(
        request_row.request_no, target_value, 'Sub_Item', request_row.result_sub_item_code, 'Upsert'
      );
      if event_value is not null then event_count := event_count + 1; end if;
    end if;
    if request_row.replaced_sub_item_code is not null and exists (
      select 1 from public.mdm_sub_item where sub_item_code = request_row.replaced_sub_item_code and status = 'Inactive'
    ) then
      event_value := public.mdm_enqueue_downstream_entity(
        request_row.request_no, target_value, 'Sub_Item', request_row.replaced_sub_item_code, 'Deactivate'
      );
      if event_value is not null then event_count := event_count + 1; end if;
    end if;
  end loop;
  return jsonb_build_object('ok', true, 'request_no', p_request_no, 'enqueued', event_count);
end;
$$;

create or replace function public.mdm_queue_approved_item_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.mdm_enqueue_downstream(new.request_no);
  return new;
end;
$$;
drop trigger if exists trg_mdm_request_downstream_outbox on public.mdm_item_request;
create trigger trg_mdm_request_downstream_outbox
  after update of status on public.mdm_item_request
  for each row
  when (new.status = 'Approved' and old.status is distinct from new.status)
  execute function public.mdm_queue_approved_item_request();

create or replace function public.mdm_upsert_downstream_crosswalk(
  p_target_system text,
  p_entity_type text,
  p_canonical_code text,
  p_external_id text,
  p_status text default 'Verified',
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  target_value text := upper(btrim(coalesce(p_target_system, '')));
  entity_value text := btrim(coalesce(p_entity_type, ''));
  canonical_value text := btrim(coalesce(p_canonical_code, ''));
  external_value text := btrim(coalesce(p_external_id, ''));
  unblocked_count integer := 0;
begin
  if public.mdm_current_role() not in ('Approver', 'Admin') then raise exception 'Approver or Admin role is required'; end if;
  if target_value not in ('NAV2017', 'VISTA') then raise exception 'Unsupported target system'; end if;
  if entity_value not in ('Item', 'Sub_Item') then raise exception 'Unsupported entity type'; end if;
  if p_status not in ('Pending', 'Verified', 'Blocked', 'Inactive') then raise exception 'Unsupported crosswalk status'; end if;
  if canonical_value = '' or external_value = '' then raise exception 'Canonical and external IDs are required'; end if;
  if entity_value = 'Item' and not exists (select 1 from public.mdm_item where item_code = canonical_value) then
    raise exception 'Item % does not exist', canonical_value;
  end if;
  if entity_value = 'Sub_Item' and not exists (select 1 from public.mdm_sub_item where sub_item_code = canonical_value) then
    raise exception 'Sub Item % does not exist', canonical_value;
  end if;
  if exists (
    select 1 from public.mdm_downstream_outbox
    where target_system = target_value and entity_type = entity_value and canonical_code = canonical_value
      and status = 'Processing'
  ) then raise exception 'Crosswalk cannot change while an event is Processing'; end if;
  if p_status <> 'Inactive' and exists (
    select 1 from public.mdm_downstream_crosswalk
    where target_system = target_value and entity_type = entity_value and external_id = external_value
      and canonical_code <> canonical_value and status <> 'Inactive'
  ) then raise exception 'External ID % is already mapped', external_value; end if;

  insert into public.mdm_downstream_crosswalk(
    target_system, entity_type, canonical_code, external_id, status, note,
    verified_at, verified_by, created_by, updated_by
  ) values (
    target_value, entity_value, canonical_value, external_value, p_status, nullif(btrim(p_note), ''),
    case when p_status = 'Verified' then now() end,
    case when p_status = 'Verified' then actor_email end,
    actor_email, actor_email
  )
  on conflict (target_system, entity_type, canonical_code) do update set
    external_id = excluded.external_id,
    status = excluded.status,
    note = excluded.note,
    verified_at = excluded.verified_at,
    verified_by = excluded.verified_by,
    updated_by = excluded.updated_by,
    updated_at = now();

  update public.mdm_downstream_outbox
  set external_id = case when p_status = 'Verified' then external_value else null end,
      status = case
        when p_status = 'Verified' and status in ('Blocked', 'Failed') then 'Pending'
        when p_status <> 'Verified' and status in ('Pending', 'Failed') then 'Blocked'
        else status
      end,
      last_error = case when p_status = 'Verified' then null else 'Verified crosswalk is required before dispatch' end,
      next_attempt_at = now(),
      updated_at = now()
  where target_system = target_value and entity_type = entity_value and canonical_code = canonical_value
    and status <> 'Synced';
  get diagnostics unblocked_count = row_count;

  insert into public.mdm_downstream_sync_audit(event_id, action, actor, detail)
  select event_id, 'Crosswalk_' || p_status, actor_email,
    jsonb_build_object('canonical_code', canonical_value, 'external_id', external_value)
  from public.mdm_downstream_outbox
  where target_system = target_value and entity_type = entity_value and canonical_code = canonical_value;

  return jsonb_build_object('ok', true, 'canonical_code', canonical_value, 'external_id', external_value, 'events_updated', unblocked_count);
end;
$$;

create or replace function public.mdm_retry_downstream_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  event_row public.mdm_downstream_outbox%rowtype;
  external_id_value text;
  payload_value jsonb;
begin
  if public.mdm_current_role() not in ('Approver', 'Admin') then raise exception 'Approver or Admin role is required'; end if;
  select * into event_row from public.mdm_downstream_outbox where event_id = p_event_id for update;
  if not found then raise exception 'Downstream event does not exist'; end if;
  if event_row.status not in ('Failed', 'Blocked') then raise exception 'Only Failed or Blocked events can be retried'; end if;
  select external_id into external_id_value from public.mdm_downstream_crosswalk
  where target_system = event_row.target_system and entity_type = event_row.entity_type
    and canonical_code = event_row.canonical_code and status = 'Verified';
  if external_id_value is null then
    update public.mdm_downstream_outbox set status = 'Blocked', last_error = 'Verified crosswalk is required before retry'
    where event_id = p_event_id;
    insert into public.mdm_downstream_sync_audit(event_id, action, actor, detail)
    values (p_event_id, 'Retry_Blocked', actor_email, jsonb_build_object('reason', 'Missing verified crosswalk'));
    return jsonb_build_object('ok', false, 'error', 'Verified crosswalk is required before retry');
  end if;
  payload_value := public.mdm_build_downstream_payload(event_row.target_system, event_row.entity_type, event_row.canonical_code);
  update public.mdm_downstream_outbox
  set external_id = external_id_value, payload = payload_value, payload_hash = md5(payload_value::text),
      status = 'Pending', last_error = null, response_payload = null, next_attempt_at = now(),
      locked_at = null, locked_by = null, updated_at = now()
  where event_id = p_event_id;
  insert into public.mdm_downstream_sync_audit(event_id, action, actor, detail)
  values (p_event_id, 'Manual_Retry', actor_email, jsonb_build_object('payload_hash', md5(payload_value::text)));
  return jsonb_build_object('ok', true, 'event_id', p_event_id, 'status', 'Pending');
end;
$$;

create or replace function public.mdm_claim_downstream_events(
  p_target_system text,
  p_worker_id text,
  p_limit integer default 25
)
returns setof public.mdm_downstream_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Service role is required'; end if;
  if upper(p_target_system) not in ('NAV2017', 'VISTA') then raise exception 'Unsupported target system'; end if;
  if nullif(btrim(p_worker_id), '') is null then raise exception 'Worker ID is required'; end if;
  return query
  with picked as (
    select event_id from public.mdm_downstream_outbox
    where target_system = upper(p_target_system)
      and external_id is not null
      and (
        (status in ('Pending', 'Failed') and next_attempt_at <= now())
        or (status = 'Processing' and locked_at < now() - interval '15 minutes')
      )
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  )
  update public.mdm_downstream_outbox o
  set status = 'Processing', locked_at = now(), locked_by = p_worker_id,
      attempt_count = o.attempt_count + 1, updated_at = now()
  from picked where o.event_id = picked.event_id
  returning o.*;
end;
$$;

create or replace function public.mdm_complete_downstream_event(
  p_event_id uuid,
  p_worker_id text,
  p_success boolean,
  p_response jsonb default null,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.mdm_downstream_outbox%rowtype;
  new_status text;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then raise exception 'Service role is required'; end if;
  select * into event_row from public.mdm_downstream_outbox where event_id = p_event_id for update;
  if not found then raise exception 'Downstream event does not exist'; end if;
  if event_row.status = 'Synced' and p_success then
    return jsonb_build_object('ok', true, 'event_id', p_event_id, 'already_completed', true);
  end if;
  if event_row.status <> 'Processing' or event_row.locked_by is distinct from p_worker_id then
    raise exception 'Event is not claimed by this worker';
  end if;
  new_status := case when p_success then 'Synced' else 'Failed' end;
  update public.mdm_downstream_outbox
  set status = new_status,
      response_payload = p_response,
      last_error = case when p_success then null else coalesce(nullif(btrim(p_error), ''), 'Downstream adapter failed') end,
      synced_at = case when p_success then now() else null end,
      next_attempt_at = case when p_success then next_attempt_at
        else now() + make_interval(secs => least(3600, (power(2, greatest(event_row.attempt_count, 1)) * 60)::integer)) end,
      locked_at = null, locked_by = null, updated_at = now()
  where event_id = p_event_id;
  insert into public.mdm_downstream_sync_audit(event_id, action, actor, detail)
  values (
    p_event_id,
    case when p_success then 'Dispatch_Succeeded' else 'Dispatch_Failed' end,
    p_worker_id,
    jsonb_build_object('response', p_response, 'error', p_error, 'attempt', event_row.attempt_count)
  );
  return jsonb_build_object('ok', p_success, 'event_id', p_event_id, 'status', new_status);
end;
$$;

alter table public.mdm_downstream_field_mapping enable row level security;
alter table public.mdm_downstream_crosswalk enable row level security;
alter table public.mdm_downstream_outbox enable row level security;
alter table public.mdm_downstream_sync_audit enable row level security;

drop policy if exists mdm_downstream_read on public.mdm_downstream_field_mapping;
create policy mdm_downstream_read on public.mdm_downstream_field_mapping for select to authenticated using (true);
drop policy if exists mdm_downstream_read on public.mdm_downstream_crosswalk;
create policy mdm_downstream_read on public.mdm_downstream_crosswalk for select to authenticated using (true);
drop policy if exists mdm_downstream_read on public.mdm_downstream_outbox;
create policy mdm_downstream_read on public.mdm_downstream_outbox for select to authenticated using (true);
drop policy if exists mdm_downstream_read on public.mdm_downstream_sync_audit;
create policy mdm_downstream_read on public.mdm_downstream_sync_audit for select to authenticated using (true);

revoke all on public.mdm_downstream_field_mapping from anon, authenticated;
revoke all on public.mdm_downstream_crosswalk from anon, authenticated;
revoke all on public.mdm_downstream_outbox from anon, authenticated;
revoke all on public.mdm_downstream_sync_audit from anon, authenticated;
grant select on public.mdm_downstream_field_mapping to authenticated;
grant select on public.mdm_downstream_crosswalk to authenticated;
grant select on public.mdm_downstream_outbox to authenticated;
grant select on public.mdm_downstream_sync_audit to authenticated;

revoke all on function public.mdm_build_downstream_payload(text, text, text) from public, anon, authenticated;
revoke all on function public.mdm_enqueue_downstream_entity(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.mdm_enqueue_downstream(text) from public, anon, authenticated;
revoke all on function public.mdm_queue_approved_item_request() from public, anon, authenticated;
revoke all on function public.mdm_upsert_downstream_crosswalk(text, text, text, text, text, text) from public, anon;
revoke all on function public.mdm_retry_downstream_event(uuid) from public, anon;
grant execute on function public.mdm_upsert_downstream_crosswalk(text, text, text, text, text, text) to authenticated;
grant execute on function public.mdm_retry_downstream_event(uuid) to authenticated;
revoke all on function public.mdm_claim_downstream_events(text, text, integer) from public, anon, authenticated;
revoke all on function public.mdm_complete_downstream_event(uuid, text, boolean, jsonb, text) from public, anon, authenticated;
grant execute on function public.mdm_claim_downstream_events(text, text, integer) to service_role;
grant execute on function public.mdm_complete_downstream_event(uuid, text, boolean, jsonb, text) to service_role;

-- Backfill only previously approved workflow requests. Idempotent event_key prevents duplicates.
do $$
declare approved_request record;
begin
  for approved_request in
    select request_no from public.mdm_item_request
    where status = 'Approved' and (result_item_code is not null or result_sub_item_code is not null)
  loop
    perform public.mdm_enqueue_downstream(approved_request.request_no);
  end loop;
end $$;

commit;
