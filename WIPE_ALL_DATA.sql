-- Chạy lệnh này trong SQL Editor của Supabase để XÓA SẠCH SÀNH SANH dữ liệu
-- Lưu ý: Lệnh này sẽ xóa toàn bộ Nhà cung cấp, Hợp đồng, Chứng nhận, Người liên hệ...
-- (Cấu trúc bảng vẫn giữ nguyên, chỉ xóa dữ liệu bên trong)

TRUNCATE TABLE vendor CASCADE;
