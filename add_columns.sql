-- Chạy đoạn này trong SQL Editor của Supabase
alter table vendor_document add column if not exists valid_to date;
alter table vendor_document add column if not exists issue_date date;
alter table vendor_document add column if not exists is_auto_renew boolean default false;
alter table vendor_document add column if not exists doc_status text;
alter table vendor_document add column if not exists pic_email text;
