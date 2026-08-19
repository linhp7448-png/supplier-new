-- Chạy đoạn này trong SQL Editor của Supabase để sửa lỗi 409 Conflict
drop index if exists uq_vendor_tax;
alter table vendor drop constraint if exists vendor_tax_code_key;
