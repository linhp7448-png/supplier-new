-- Chạy 1 LẦN DUY NHẤT ĐOẠN NÀY ĐỂ SỬA TẤT CẢ CÁC LỖI (Bao gồm lỗi 409 Conflict)

-- 1. Bổ sung các cột hồ sơ bị thiếu
alter table vendor_document add column if not exists valid_to date;
alter table vendor_document add column if not exists issue_date date;
alter table vendor_document add column if not exists is_auto_renew boolean default false;
alter table vendor_document add column if not exists doc_status text;
alter table vendor_document add column if not exists pic_email text;

-- 2. Gỡ bỏ ràng buộc MST độc nhất (Để cho phép các chi nhánh dùng chung Mã số thuế)
drop index if exists uq_vendor_tax;
alter table vendor drop constraint if exists vendor_tax_code_key;
alter table vendor drop constraint if exists uq_vendor_tax;
