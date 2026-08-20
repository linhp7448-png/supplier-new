-- ============================================================
-- G-ERP Supplier Management — Canonical Item Management
-- Phase 2: schema, constraints, indexes and role-based RLS
-- ============================================================

create extension if not exists pgcrypto;

-- app_role exists in older manual installs but was not part of the official
-- migration chain. Keep this declaration compatible with both environments.
create table if not exists public.app_role (
  email text primary key,
  role text not null
);
alter table public.app_role enable row level security;

create table if not exists public.mdm_category (
  category_code text primary key,
  domain text not null,
  l1 text not null,
  l2 text,
  l3 text,
  spend_type text,
  default_allocation text not null default 'FIFO'
    check (default_allocation in ('FEFO', 'FIFO', 'None')),
  batch_required boolean not null default false,
  owner_name text,
  status text not null default 'Active'
    check (status in ('Draft', 'Pilot', 'Active', 'Inactive')),
  source_system text not null default 'G_ERP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mdm_item (
  item_code text primary key,
  domain text not null,
  category_code text not null references public.mdm_category(category_code),
  item_name text not null,
  functional_uom text not null,
  allocation_policy text not null default 'FIFO'
    check (allocation_policy in ('FEFO', 'FIFO', 'None')),
  batch_required boolean not null default false,
  split_allowed boolean not null default true,
  exact_only boolean not null default false,
  business_line text,
  legacy_item_no text,
  source_system text not null default 'G_ERP',
  review_status text not null default 'Approved',
  review_note text,
  status text not null default 'Active'
    check (status in ('Draft', 'Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_mdm_item_legacy
  on public.mdm_item(source_system, legacy_item_no)
  where legacy_item_no is not null;
create index if not exists ix_mdm_item_category on public.mdm_item(category_code);
create index if not exists ix_mdm_item_name on public.mdm_item(lower(item_name));

create table if not exists public.mdm_sub_item (
  sub_item_code text primary key,
  item_code text not null references public.mdm_item(item_code),
  sub_item_name text not null,
  brand text,
  manufacturer text,
  purchase_uom text,
  conversion_factor numeric check (conversion_factor is null or conversion_factor > 0),
  base_uom text,
  shelf_life_days numeric check (shelf_life_days is null or shelf_life_days >= 0),
  storage_condition text,
  batch_control boolean not null default false,
  serial_control boolean not null default false,
  gtin text,
  country_of_origin text,
  image_status text not null default 'Missing'
    check (image_status in ('Missing', 'Available', 'Needs_Review')),
  status text not null default 'Active'
    check (status in ('Draft', 'Active', 'Inactive')),
  review_status text not null default 'Approved',
  source_system text not null default 'G_ERP',
  physical_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (physical_fingerprint)
);
create index if not exists ix_mdm_sub_item_item on public.mdm_sub_item(item_code);
create index if not exists ix_mdm_sub_item_name on public.mdm_sub_item(lower(sub_item_name));

create table if not exists public.mdm_product_content (
  sub_item_code text primary key references public.mdm_sub_item(sub_item_code) on delete cascade,
  display_name text,
  brand text,
  manufacturer text,
  pack_description text,
  gtin text,
  country_of_origin text,
  content_status text not null default 'Needs_Enrichment'
    check (content_status in ('Needs_Enrichment', 'Complete', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Image is part of Product Content. Phase 3 will edit it only through the
-- "Thêm / thay sản phẩm" flow and search will consume it read-only.
create table if not exists public.mdm_product_image (
  image_id uuid primary key default gen_random_uuid(),
  sub_item_code text not null references public.mdm_sub_item(sub_item_code) on delete cascade,
  storage_path text,
  source_url text,
  alt_text text,
  display_order integer not null default 0 check (display_order >= 0),
  is_primary boolean not null default false,
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  source_system text not null default 'G_ERP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(storage_path), '') is not null or nullif(trim(source_url), '') is not null)
);
create unique index if not exists uq_mdm_product_image_source
  on public.mdm_product_image(sub_item_code, coalesce(storage_path, ''), coalesce(source_url, ''));
create unique index if not exists uq_mdm_product_image_primary
  on public.mdm_product_image(sub_item_code) where is_primary and status = 'Active';

create table if not exists public.mdm_supplier_offer (
  offer_id text primary key,
  sub_item_code text not null references public.mdm_sub_item(sub_item_code),
  vendor_code text not null references public.vendor(code),
  vendor_name text,
  purchase_uom text,
  conversion_factor numeric check (conversion_factor is null or conversion_factor > 0),
  base_uom text,
  currency text not null default 'VND',
  moq numeric check (moq is null or moq >= 0),
  mov numeric check (mov is null or mov >= 0),
  ship_if text,
  lead_time_days numeric check (lead_time_days is null or lead_time_days >= 0),
  unit_price_excl_vat numeric check (unit_price_excl_vat is null or unit_price_excl_vat >= 0),
  valid_from date,
  valid_to date,
  preferred boolean not null default false,
  status text not null default 'Active' check (status in ('Draft', 'Active', 'Inactive')),
  source_system text not null default 'G_ERP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sub_item_code, vendor_code),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create index if not exists ix_mdm_offer_vendor on public.mdm_supplier_offer(vendor_code);
create index if not exists ix_mdm_offer_sub_item on public.mdm_supplier_offer(sub_item_code);

-- Commercial terms may vary by cinema/location. Do not duplicate a physical
-- Sub Item simply because the same vendor supplies it to another location.
create table if not exists public.mdm_supplier_offer_location (
  offer_id text not null references public.mdm_supplier_offer(offer_id) on delete cascade,
  location_code text not null references public.locations(loc_code),
  region text,
  moq numeric check (moq is null or moq >= 0),
  mov numeric check (mov is null or mov >= 0),
  ship_if text,
  source_row_count integer not null default 1 check (source_row_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (offer_id, location_code)
);
create index if not exists ix_mdm_offer_location_location
  on public.mdm_supplier_offer_location(location_code);

create sequence if not exists public.mdm_request_seq start 1;
create table if not exists public.mdm_item_request (
  request_no text primary key default ('IMR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.mdm_request_seq')::text, 6, '0')),
  request_type text not null default 'Create_Sub_Item',
  requested_name text not null,
  business_need text,
  domain text,
  requested_item_code text references public.mdm_item(item_code),
  proposed_payload jsonb not null default '{}'::jsonb,
  image_path text,
  requester text not null default coalesce(auth.jwt() ->> 'email', 'unknown'),
  current_owner text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Submitted', 'Pending_Review', 'Approved', 'Rejected', 'Cancelled')),
  decision_note text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ix_mdm_request_status on public.mdm_item_request(status, created_at desc);

create table if not exists public.mdm_legacy_lineage (
  source_system text not null,
  raw_rid uuid not null,
  item_code text references public.mdm_item(item_code),
  sub_item_code text references public.mdm_sub_item(sub_item_code),
  offer_id text references public.mdm_supplier_offer(offer_id),
  location_code text,
  source_fingerprint text not null,
  issue_code text,
  migrated_at timestamptz not null default now(),
  primary key (source_system, raw_rid)
);
create index if not exists ix_mdm_lineage_item on public.mdm_legacy_lineage(item_code);
create index if not exists ix_mdm_lineage_sub_item on public.mdm_legacy_lineage(sub_item_code);

create table if not exists public.mdm_data_issue (
  issue_id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_key text not null,
  issue_code text not null,
  severity text not null default 'Warning' check (severity in ('Info', 'Warning', 'Error')),
  details jsonb not null default '{}'::jsonb,
  status text not null default 'Open' check (status in ('Open', 'Resolved', 'Ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (source_system, source_key, issue_code)
);
create index if not exists ix_mdm_issue_open on public.mdm_data_issue(status, issue_code);

create table if not exists public.mdm_migration_run (
  run_key text primary key,
  source_system text not null,
  status text not null check (status in ('Running', 'Completed', 'Failed')),
  source_row_count integer not null default 0,
  item_count integer not null default 0,
  sub_item_count integer not null default 0,
  offer_count integer not null default 0,
  offer_location_count integer not null default 0,
  issue_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes jsonb not null default '{}'::jsonb
);

-- Shared updated_at trigger.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'mdm_category', 'mdm_item', 'mdm_sub_item', 'mdm_product_content',
    'mdm_product_image', 'mdm_supplier_offer', 'mdm_supplier_offer_location',
    'mdm_item_request'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'trg_' || table_name || '_touch', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated()', 'trg_' || table_name || '_touch', table_name);
  end loop;
end $$;

create or replace function public.mdm_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select ar.role from public.app_role ar where lower(ar.email) = lower(auth.jwt() ->> 'email')),
    'Viewer'
  );
$$;

create or replace function public.mdm_can_manage_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mdm_current_role() in ('Admin', 'Approver');
$$;

create or replace function public.mdm_can_submit_intake()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.mdm_current_role() in ('Admin', 'Approver', 'Buyer');
$$;

revoke all on function public.mdm_current_role() from public;
revoke all on function public.mdm_can_manage_master() from public;
revoke all on function public.mdm_can_submit_intake() from public;
grant execute on function public.mdm_current_role() to authenticated;
grant execute on function public.mdm_can_manage_master() to authenticated;
grant execute on function public.mdm_can_submit_intake() to authenticated;

drop policy if exists app_role_read on public.app_role;
create policy app_role_read on public.app_role
  for select to authenticated using (true);
drop policy if exists app_role_manage on public.app_role;
create policy app_role_manage on public.app_role
  for all to authenticated
  using (public.mdm_current_role() = 'Admin')
  with check (public.mdm_current_role() = 'Admin');

-- 0001 temporarily allowed every authenticated user to mutate legacy SCM.
-- Keep it readable as migration evidence, but restrict writes to master roles.
do $$
declare table_name text;
begin
  foreach table_name in array array['locations', 'items', 'raw_data'] loop
    execute format('drop policy if exists p_all on public.%I', table_name);
    execute format('drop policy if exists legacy_read on public.%I', table_name);
    execute format('create policy legacy_read on public.%I for select to authenticated using (true)', table_name);
    execute format('drop policy if exists legacy_manage on public.%I', table_name);
    execute format('create policy legacy_manage on public.%I for all to authenticated using (public.mdm_can_manage_master()) with check (public.mdm_can_manage_master())', table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'mdm_category', 'mdm_item', 'mdm_sub_item', 'mdm_product_content',
    'mdm_product_image', 'mdm_supplier_offer', 'mdm_supplier_offer_location',
    'mdm_item_request', 'mdm_legacy_lineage', 'mdm_data_issue', 'mdm_migration_run'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists mdm_read on public.%I', table_name);
    execute format('create policy mdm_read on public.%I for select to authenticated using (true)', table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'mdm_category', 'mdm_item', 'mdm_sub_item', 'mdm_product_content',
    'mdm_product_image', 'mdm_supplier_offer', 'mdm_supplier_offer_location',
    'mdm_item_request', 'mdm_legacy_lineage', 'mdm_data_issue', 'mdm_migration_run'
  ] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;
grant usage, select on sequence public.mdm_request_seq to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'mdm_category', 'mdm_item', 'mdm_sub_item', 'mdm_product_content',
    'mdm_product_image', 'mdm_supplier_offer', 'mdm_supplier_offer_location'
  ] loop
    execute format('drop policy if exists mdm_manage on public.%I', table_name);
    execute format('create policy mdm_manage on public.%I for all to authenticated using (public.mdm_can_manage_master()) with check (public.mdm_can_manage_master())', table_name);
  end loop;
end $$;

drop policy if exists mdm_request_insert on public.mdm_item_request;
create policy mdm_request_insert on public.mdm_item_request
  for insert to authenticated
  with check (
    public.mdm_can_submit_intake()
    and lower(requester) = lower(auth.jwt() ->> 'email')
  );
drop policy if exists mdm_request_manage on public.mdm_item_request;
create policy mdm_request_manage on public.mdm_item_request
  for update to authenticated
  using (public.mdm_can_manage_master())
  with check (public.mdm_can_manage_master());

do $$
declare table_name text;
begin
  foreach table_name in array array['mdm_legacy_lineage', 'mdm_data_issue', 'mdm_migration_run'] loop
    execute format('drop policy if exists mdm_manage on public.%I', table_name);
    execute format('create policy mdm_manage on public.%I for all to authenticated using (public.mdm_can_manage_master()) with check (public.mdm_can_manage_master())', table_name);
  end loop;
end $$;

-- Tighten image writes while preserving public/authenticated reads configured
-- by 0001. Buyer may upload intake evidence; only master managers may delete.
drop policy if exists sp_img_write on storage.objects;
create policy sp_img_write on storage.objects for insert to authenticated
  with check (bucket_id = 'item_images' and public.mdm_can_submit_intake());
drop policy if exists sp_img_del on storage.objects;
create policy sp_img_del on storage.objects for delete to authenticated
  using (bucket_id = 'item_images' and public.mdm_can_manage_master());

create or replace view public.mdm_item_reconciliation as
select
  (select count(*) from public.mdm_item where source_system = 'GALAXY_SCM') as item_count,
  (select count(*) from public.mdm_sub_item where source_system = 'GALAXY_SCM') as sub_item_count,
  (select count(*) from public.mdm_supplier_offer where source_system = 'GALAXY_SCM') as offer_count,
  (select count(*) from public.mdm_supplier_offer_location ol join public.mdm_supplier_offer o using (offer_id) where o.source_system = 'GALAXY_SCM') as offer_location_count,
  (select count(*) from public.mdm_legacy_lineage where source_system = 'GALAXY_SCM') as lineage_count,
  (select count(*) from public.mdm_data_issue where source_system = 'GALAXY_SCM' and status = 'Open') as open_issue_count;

grant select on public.mdm_item_reconciliation to authenticated;
