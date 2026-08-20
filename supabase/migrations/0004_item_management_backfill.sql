-- ============================================================
-- G-ERP Supplier Management — GALAXY-SCM canonical backfill
-- Idempotent: safe to run again after 0003_item_management.sql
-- raw_data remains immutable legacy evidence; no user import is required.
-- ============================================================

begin;

create or replace function public.mdm_legacy_clean(value text)
returns text
language sql
immutable
as $$
  select lower(btrim(replace(coalesce(value, ''), chr(160), ' ')));
$$;

create or replace function public.mdm_legacy_physical_key(
  p_item_no text,
  p_sub_desc text,
  p_brand text,
  p_purchase_uom text,
  p_conversion text,
  p_base_uom text,
  p_shelf_life text,
  p_storage text
)
returns text
language sql
immutable
as $$
  select concat_ws(chr(31),
    public.mdm_legacy_clean(p_item_no),
    public.mdm_legacy_clean(p_sub_desc),
    public.mdm_legacy_clean(p_brand),
    public.mdm_legacy_clean(p_purchase_uom),
    public.mdm_legacy_clean(p_conversion),
    public.mdm_legacy_clean(p_base_uom),
    public.mdm_legacy_clean(p_shelf_life),
    public.mdm_legacy_clean(p_storage)
  );
$$;

insert into public.mdm_migration_run(run_key, source_system, status, source_row_count, started_at, completed_at, notes)
select 'GALAXY_SCM_CANONICAL_V1', 'GALAXY_SCM', 'Running', count(*), now(), null,
       jsonb_build_object('source_table', 'raw_data', 'mode', 'idempotent_backfill')
from public.raw_data
on conflict (run_key) do update set
  status = 'Running',
  source_row_count = excluded.source_row_count,
  started_at = now(),
  completed_at = null,
  notes = excluded.notes;

insert into public.mdm_category(
  category_code, domain, l1, l2, l3, spend_type,
  default_allocation, batch_required, owner_name, status, source_system
)
select distinct
  'FNB-LEGACY-' || upper(substr(md5(coalesce(nullif(btrim(i.category), ''), 'Uncategorized')), 1, 10)),
  'F&B',
  coalesce(nullif(btrim(i.category), ''), 'Uncategorized'),
  'Legacy SCM',
  null,
  'Direct',
  case when exists (
    select 1 from public.raw_data r
    where r.item_no = i.item_no and coalesce(r.hsd, 0) > 0
  ) then 'FEFO' else 'FIFO' end,
  exists (
    select 1 from public.raw_data r
    where r.item_no = i.item_no and coalesce(r.hsd, 0) > 0
  ),
  'F&B Category Owner',
  'Active',
  'GALAXY_SCM'
from public.items i
on conflict (category_code) do nothing;

insert into public.mdm_item(
  item_code, domain, category_code, item_name, functional_uom,
  allocation_policy, batch_required, split_allowed, exact_only,
  business_line, legacy_item_no, source_system, review_status, status
)
select
  i.item_no,
  'F&B',
  'FNB-LEGACY-' || upper(substr(md5(coalesce(nullif(btrim(i.category), ''), 'Uncategorized')), 1, 10)),
  i.description,
  coalesce((
    select nullif(btrim(r.base_unit), '')
    from public.raw_data r
    where r.item_no = i.item_no and nullif(btrim(r.base_unit), '') is not null
    group by btrim(r.base_unit)
    order by count(*) desc, btrim(r.base_unit)
    limit 1
  ), 'cai'),
  case when exists (
    select 1 from public.raw_data r
    where r.item_no = i.item_no and coalesce(r.hsd, 0) > 0
  ) then 'FEFO' else 'FIFO' end,
  exists (
    select 1 from public.raw_data r
    where r.item_no = i.item_no and coalesce(r.hsd, 0) > 0
  ),
  true,
  false,
  coalesce(nullif(btrim(i.category), ''), 'Legacy SCM'),
  i.item_no,
  'GALAXY_SCM',
  'Approved',
  'Active'
from public.items i
where not exists (
  select 1 from public.mdm_item existing
  where existing.legacy_item_no = i.item_no
)
on conflict (item_code) do update set
  legacy_item_no = coalesce(public.mdm_item.legacy_item_no, excluded.legacy_item_no),
  updated_at = now();

with source_variants as (
  select
    r.*,
    public.mdm_legacy_physical_key(
      r.item_no, r.sub_desc, r.brand, r.purch_unit,
      r.conversion::text, r.base_unit, r.hsd::text, r.storage
    ) as physical_key
  from public.raw_data r
  where nullif(public.mdm_legacy_clean(r.item_no), '') is not null
), variants as (
  select
    physical_key,
    min(item_no) as item_no,
    coalesce(nullif(min(sub_desc), ''), min(item_no)) as sub_item_name,
    nullif(min(brand), '') as brand,
    nullif(min(purch_unit), '') as purchase_uom,
    min(conversion) as conversion_factor,
    nullif(min(base_unit), '') as base_uom,
    min(hsd) as shelf_life_days,
    nullif(min(storage), '') as storage_condition,
    bool_or(nullif(btrim(coalesce(image_url, '')), '') is not null) as has_image
  from source_variants
  group by physical_key
), mapped_variants as (
  select
    v.*,
    coalesce((
      select existing.item_code
      from public.mdm_item existing
      where existing.item_code = v.item_no or existing.legacy_item_no = v.item_no
      order by (existing.item_code = v.item_no) desc, existing.created_at
      limit 1
    ), v.item_no) as canonical_item_code
  from variants v
)
insert into public.mdm_sub_item(
  sub_item_code, item_code, sub_item_name, brand, manufacturer,
  purchase_uom, conversion_factor, base_uom, shelf_life_days,
  storage_condition, batch_control, serial_control, image_status,
  status, review_status, source_system, physical_fingerprint
)
select
  v.canonical_item_code || '-' || upper(substr(md5(v.physical_key), 1, 8)),
  v.canonical_item_code,
  v.sub_item_name,
  v.brand,
  v.brand,
  v.purchase_uom,
  v.conversion_factor,
  v.base_uom,
  v.shelf_life_days,
  v.storage_condition,
  coalesce(v.shelf_life_days, 0) > 0,
  false,
  case when v.has_image then 'Available' else 'Missing' end,
  'Active',
  'Approved',
  'GALAXY_SCM',
  v.physical_key
from mapped_variants v
on conflict (physical_fingerprint) do update set
  sub_item_name = excluded.sub_item_name,
  brand = excluded.brand,
  purchase_uom = excluded.purchase_uom,
  conversion_factor = excluded.conversion_factor,
  base_uom = excluded.base_uom,
  shelf_life_days = excluded.shelf_life_days,
  storage_condition = excluded.storage_condition,
  image_status = excluded.image_status,
  updated_at = now()
where public.mdm_sub_item.source_system = 'GALAXY_SCM';

insert into public.mdm_product_content(
  sub_item_code, display_name, brand, manufacturer, pack_description,
  content_status
)
select
  s.sub_item_code,
  s.sub_item_name,
  s.brand,
  s.manufacturer,
  concat_ws(' · ', nullif(s.purchase_uom, ''),
    case when s.conversion_factor is not null
      then s.conversion_factor::text || ' ' || coalesce(s.base_uom, '')
    end),
  case when s.image_status = 'Available' and nullif(s.brand, '') is not null
    then 'Complete' else 'Needs_Enrichment' end
from public.mdm_sub_item s
where s.source_system = 'GALAXY_SCM'
on conflict (sub_item_code) do update set
  display_name = excluded.display_name,
  brand = excluded.brand,
  manufacturer = excluded.manufacturer,
  pack_description = excluded.pack_description,
  content_status = excluded.content_status,
  updated_at = now();

with image_source as (
  select distinct
    s.sub_item_code,
    nullif(btrim(r.image_url), '') as source_url,
    coalesce(nullif(btrim(r.sub_desc), ''), i.description, r.item_no) as alt_text
  from public.raw_data r
  join public.items i on i.item_no = r.item_no
  join public.mdm_sub_item s on s.physical_fingerprint = public.mdm_legacy_physical_key(
    r.item_no, r.sub_desc, r.brand, r.purch_unit,
    r.conversion::text, r.base_unit, r.hsd::text, r.storage
  )
  where nullif(btrim(r.image_url), '') is not null
), ranked_images as (
  select image_source.*,
         row_number() over (partition by sub_item_code order by source_url) as image_rank
  from image_source
)
insert into public.mdm_product_image(
  sub_item_code, source_url, alt_text, display_order, is_primary, source_system
)
select r.sub_item_code, r.source_url, r.alt_text, r.image_rank - 1,
       r.image_rank = 1, 'GALAXY_SCM'
from ranked_images r
where not exists (
  select 1 from public.mdm_product_image pi
  where pi.sub_item_code = r.sub_item_code and pi.source_url = r.source_url
);

with source_offers as (
  select
    r.*,
    public.mdm_legacy_physical_key(
      r.item_no, r.sub_desc, r.brand, r.purch_unit,
      r.conversion::text, r.base_unit, r.hsd::text, r.storage
    ) as physical_key
  from public.raw_data r
  where nullif(public.mdm_legacy_clean(r.vendor_code), '') is not null
), offers as (
  select
    s.sub_item_code,
    so.vendor_code,
    min(so.purch_unit) as purchase_uom,
    min(so.conversion) as conversion_factor,
    min(so.base_unit) as base_uom,
    min(so.moq) as moq,
    min(so.mov) as mov,
    string_agg(distinct nullif(btrim(so.ship_if), ''), ', ' order by nullif(btrim(so.ship_if), '')) as ship_if
  from source_offers so
  join public.mdm_sub_item s on s.physical_fingerprint = so.physical_key
  group by s.sub_item_code, so.vendor_code
)
insert into public.mdm_supplier_offer(
  offer_id, sub_item_code, vendor_code, vendor_name, purchase_uom,
  conversion_factor, base_uom, currency, moq, mov, ship_if,
  status, source_system
)
select
  'OFFER-SCM-' || upper(substr(md5(o.sub_item_code || chr(31) || o.vendor_code), 1, 16)),
  o.sub_item_code,
  o.vendor_code,
  v.name,
  o.purchase_uom,
  o.conversion_factor,
  o.base_uom,
  coalesce(nullif(v.cur, ''), 'VND'),
  o.moq,
  o.mov,
  o.ship_if,
  'Active',
  'GALAXY_SCM'
from offers o
join public.vendor v on v.code = o.vendor_code
on conflict (sub_item_code, vendor_code) do update set
  vendor_name = excluded.vendor_name,
  purchase_uom = excluded.purchase_uom,
  conversion_factor = excluded.conversion_factor,
  base_uom = excluded.base_uom,
  currency = excluded.currency,
  moq = excluded.moq,
  mov = excluded.mov,
  ship_if = excluded.ship_if,
  updated_at = now()
where public.mdm_supplier_offer.source_system = 'GALAXY_SCM';

with source_locations as (
  select
    r.*,
    public.mdm_legacy_physical_key(
      r.item_no, r.sub_desc, r.brand, r.purch_unit,
      r.conversion::text, r.base_unit, r.hsd::text, r.storage
    ) as physical_key
  from public.raw_data r
  where nullif(public.mdm_legacy_clean(r.vendor_code), '') is not null
    and nullif(public.mdm_legacy_clean(r.loc_code), '') is not null
), offer_locations as (
  select
    o.offer_id,
    sl.loc_code,
    l.region,
    min(sl.moq) as moq,
    min(sl.mov) as mov,
    string_agg(distinct nullif(btrim(sl.ship_if), ''), ', ' order by nullif(btrim(sl.ship_if), '')) as ship_if,
    count(*)::integer as source_row_count
  from source_locations sl
  join public.mdm_sub_item s on s.physical_fingerprint = sl.physical_key
  join public.mdm_supplier_offer o
    on o.sub_item_code = s.sub_item_code and o.vendor_code = sl.vendor_code
  join public.locations l on l.loc_code = sl.loc_code
  group by o.offer_id, sl.loc_code, l.region
)
insert into public.mdm_supplier_offer_location(
  offer_id, location_code, region, moq, mov, ship_if, source_row_count
)
select offer_id, loc_code, region, moq, mov, ship_if, source_row_count
from offer_locations
on conflict (offer_id, location_code) do update set
  region = excluded.region,
  moq = excluded.moq,
  mov = excluded.mov,
  ship_if = excluded.ship_if,
  source_row_count = excluded.source_row_count,
  updated_at = now();

insert into public.mdm_legacy_lineage(
  source_system, raw_rid, item_code, sub_item_code, offer_id,
  location_code, source_fingerprint, issue_code, migrated_at
)
select
  'GALAXY_SCM',
  r.rid,
  coalesce(s.item_code, r.item_no),
  s.sub_item_code,
  o.offer_id,
  r.loc_code,
  md5(concat_ws(chr(31), r.rid::text, r.item_no, r.vendor_code, r.loc_code,
    r.sub_desc, r.brand, r.purch_unit, r.conversion::text, r.base_unit,
    r.moq::text, r.mov::text, r.ship_if, r.hsd::text, r.storage, r.image_url)),
  case
    when nullif(public.mdm_legacy_clean(r.vendor_code), '') is null then 'MISSING_VENDOR'
    when r.conversion is null or r.conversion <= 0 then 'INVALID_CONVERSION'
    when nullif(public.mdm_legacy_clean(r.base_unit), '') is null then 'MISSING_BASE_UOM'
    else null
  end,
  now()
from public.raw_data r
left join public.mdm_sub_item s on s.physical_fingerprint = public.mdm_legacy_physical_key(
  r.item_no, r.sub_desc, r.brand, r.purch_unit,
  r.conversion::text, r.base_unit, r.hsd::text, r.storage
)
left join public.mdm_supplier_offer o
  on o.sub_item_code = s.sub_item_code and o.vendor_code = r.vendor_code
on conflict (source_system, raw_rid) do update set
  item_code = excluded.item_code,
  sub_item_code = excluded.sub_item_code,
  offer_id = excluded.offer_id,
  location_code = excluded.location_code,
  source_fingerprint = excluded.source_fingerprint,
  issue_code = excluded.issue_code,
  migrated_at = now();

insert into public.mdm_data_issue(source_system, source_key, issue_code, severity, details)
select 'GALAXY_SCM', r.rid::text, 'MISSING_VENDOR', 'Error',
       jsonb_build_object('item_no', r.item_no, 'location_code', r.loc_code)
from public.raw_data r
where nullif(public.mdm_legacy_clean(r.vendor_code), '') is null
on conflict (source_system, source_key, issue_code) do update set
  details = excluded.details,
  status = 'Open',
  resolved_at = null;

insert into public.mdm_data_issue(source_system, source_key, issue_code, severity, details)
select 'GALAXY_SCM', r.rid::text, 'INVALID_CONVERSION', 'Warning',
       jsonb_build_object('item_no', r.item_no, 'conversion', r.conversion)
from public.raw_data r
where r.conversion is null or r.conversion <= 0
on conflict (source_system, source_key, issue_code) do update set
  details = excluded.details,
  status = 'Open',
  resolved_at = null;

insert into public.mdm_data_issue(source_system, source_key, issue_code, severity, details)
select 'GALAXY_SCM', r.rid::text, 'MISSING_BASE_UOM', 'Warning',
       jsonb_build_object('item_no', r.item_no, 'sub_description', r.sub_desc)
from public.raw_data r
where nullif(public.mdm_legacy_clean(r.base_unit), '') is null
on conflict (source_system, source_key, issue_code) do update set
  details = excluded.details,
  status = 'Open',
  resolved_at = null;

insert into public.mdm_data_issue(source_system, source_key, issue_code, severity, details)
select
  'GALAXY_SCM',
  ol.offer_id || '|' || ol.location_code,
  'DUPLICATE_OFFER_LOCATION',
  'Warning',
  jsonb_build_object(
    'offer_id', ol.offer_id,
    'location_code', ol.location_code,
    'source_row_count', ol.source_row_count
  )
from public.mdm_supplier_offer_location ol
join public.mdm_supplier_offer o on o.offer_id = ol.offer_id
where o.source_system = 'GALAXY_SCM' and ol.source_row_count > 1
on conflict (source_system, source_key, issue_code) do update set
  details = excluded.details,
  status = 'Open',
  resolved_at = null;

update public.mdm_migration_run
set
  status = 'Completed',
  item_count = (select count(*) from public.mdm_item where source_system = 'GALAXY_SCM'),
  sub_item_count = (select count(*) from public.mdm_sub_item where source_system = 'GALAXY_SCM'),
  offer_count = (select count(*) from public.mdm_supplier_offer where source_system = 'GALAXY_SCM'),
  offer_location_count = (
    select count(*) from public.mdm_supplier_offer_location ol
    join public.mdm_supplier_offer o using (offer_id)
    where o.source_system = 'GALAXY_SCM'
  ),
  issue_count = (
    select count(*) from public.mdm_data_issue
    where source_system = 'GALAXY_SCM' and status = 'Open'
  ),
  completed_at = now(),
  notes = notes || jsonb_build_object(
    'raw_data_preserved', true,
    'sub_item_rule', 'vendor-independent physical fingerprint',
    'offer_rule', 'one vendor per physical sub item',
    'location_rule', 'one row per offer and location'
  )
where run_key = 'GALAXY_SCM_CANONICAL_V1';

commit;
