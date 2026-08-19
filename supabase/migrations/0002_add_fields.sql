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
