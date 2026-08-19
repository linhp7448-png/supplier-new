
-- ---- XÓA BẢNG CŨ (BỊ LỖI CẤU TRÚC DO BẢN KẾ HOẠCH RÚT GỌN) ----
DROP TABLE IF EXISTS vendor CASCADE;
DROP TABLE IF EXISTS vendor_contact CASCADE;
DROP TABLE IF EXISTS vendor_alias CASCADE;
DROP TABLE IF EXISTS vendor_document CASCADE;
DROP TABLE IF EXISTS tax_risk_registry CASCADE;

-- ============================================================
--  G-ERP Supplier Management — Supabase schema (0001_init)
--  Chạy trong Supabase SQL Editor (hoặc supabase db push)
-- ============================================================

-- ---- Enums ----
do $$ begin
  create type vendor_status as enum ('Draft','Pending_Review','Active','Suspended','Blacklisted','Inactive');
exception when duplicate_object then null; end $$;

-- ---- Sequence cho vendor_code ----
create sequence if not exists vendor_code_seq start 9100;

-- ---- Bảng chính ----
create table if not exists vendor (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null default ('VD'||lpad(nextval('vendor_code_seq')::text,7,'0')),
  tax_code          text,
  parent_tax_code   text,
  name              text not null,
  vista_push_name   text,
  cat               text not null default 'Other',
  type              text not null default 'Goods',
  vpg               text, gbp text, vbp text,
  pt                text default 'NET30',
  cur               text default 'VND',
  addr              text,
  legal_rep         text,
  ref_customers     text,
  sa_done           boolean not null default false,
  sa_no             text,
  te_done           boolean not null default false,
  te_no             text,
  contract_type     text default 'Chưa ký',
  status            vendor_status not null default 'Draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint chk_mst check (tax_code is null or tax_code ~ '^[0-9]{10}(-[0-9]{3})?$')
);
create unique index if not exists uq_vendor_tax on vendor(tax_code) where tax_code is not null;

create table if not exists vendor_contact (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendor(id) on delete cascade,
  ctype text not null default 'PIC', name text, email text, phone text
);
create index if not exists ix_contact_vendor on vendor_contact(vendor_id);

create table if not exists vendor_alias (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendor(id) on delete cascade,
  source_system text not null, raw_name text, match_status text default 'Confirmed'
);
create index if not exists ix_alias_vendor on vendor_alias(vendor_id);

create table if not exists vendor_document (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendor(id) on delete cascade,
  doc_type text not null, file_name text, storage_path text, uploaded_at timestamptz default now()
);
create index if not exists ix_doc_vendor on vendor_document(vendor_id);

-- ---- Registry NCC rủi ro (nợ thuế) ----
create table if not exists tax_risk_registry (
  mst      text primary key,
  name_ocr text,
  source   text default 'Cục Thuế TP.HCM',
  added_at timestamptz default now()
);

-- ---- updated_at trigger ----
create or replace function touch_updated() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;
drop trigger if exists trg_vendor_touch on vendor;
create trigger trg_vendor_touch before update on vendor for each row execute function touch_updated();

-- ---- Storage bucket cho hồ sơ ----
insert into storage.buckets (id, name, public) values ('vendor-docs','vendor-docs', false)
on conflict (id) do nothing;

-- ============================================================
--  RLS — chỉ user đã đăng nhập (authenticated) được truy cập
-- ============================================================
alter table vendor            enable row level security;
alter table vendor_contact    enable row level security;
alter table vendor_alias      enable row level security;
alter table vendor_document   enable row level security;
alter table tax_risk_registry enable row level security;

do $$
declare t text;
begin
  foreach t in array array['vendor','vendor_contact','vendor_alias','vendor_document','tax_risk_registry'] loop
    execute format('drop policy if exists p_all on %I', t);
    execute format('create policy p_all on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Storage policies: authenticated đọc/ghi bucket vendor-docs
drop policy if exists sp_read on storage.objects;
create policy sp_read on storage.objects for select to authenticated using (bucket_id='vendor-docs');
drop policy if exists sp_write on storage.objects;
create policy sp_write on storage.objects for insert to authenticated with check (bucket_id='vendor-docs');
drop policy if exists sp_del on storage.objects;
create policy sp_del on storage.objects for delete to authenticated using (bucket_id='vendor-docs');

-- 0002: thêm trường quản lý NCC (theo Supplier Assessment sheet)
alter table vendor add column if not exists designation       text;   -- chức vụ người liên hệ chính
alter table vendor add column if not exists business_reg_no   text;   -- số GPKD
alter table vendor add column if not exists headcount         int;    -- tổng số nhân sự
alter table vendor add column if not exists products_services text;   -- sản phẩm/dịch vụ cung cấp
alter table vendor add column if not exists sub_suppliers     text;   -- nhà thầu phụ / sub-supplier
alter table vendor add column if not exists sa_date           date;   -- ngày đánh giá SA
alter table vendor add column if not exists sa_score          numeric;-- điểm SA (%)
alter table vendor add column if not exists sa_rating         text;   -- Preferred/Approved/Conditional/Not Approved
alter table vendor add column if not exists sa_purpose        text;   -- Mới / Lại / Hàng năm


-- ---- Các bảng phụ hệ thống ----
create table if not exists app_setting (
  key text primary key,
  value text,
  updated_by text,
  updated_at timestamptz default now()
);

create table if not exists item_master (
  item_no text primary key,
  updated_by text,
  updated_at timestamptz default now()
);

create table if not exists app_role (
  email text primary key,
  role text not null
);

create table if not exists app_supplier (
  email text primary key,
  vendor_code text not null
);

alter table app_setting enable row level security;
alter table item_master enable row level security;
alter table app_role enable row level security;
alter table app_supplier enable row level security;

drop policy if exists p_all on app_setting;
create policy p_all on app_setting for all to authenticated using (true) with check (true);
drop policy if exists p_all on item_master;
create policy p_all on item_master for all to authenticated using (true) with check (true);
drop policy if exists p_all on app_role;
create policy p_all on app_role for all to authenticated using (true) with check (true);
drop policy if exists p_all on app_supplier;
create policy p_all on app_supplier for all to authenticated using (true) with check (true);
