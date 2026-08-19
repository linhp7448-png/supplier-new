# G-ERP · Supplier Management — Supabase + Vercel

App quản lý nhà cung cấp (nguồn chuẩn MDM cho Galaxy Cinema). Frontend tĩnh nối
Supabase (Postgres + Auth + Storage). Không cần build step.

## Nội dung
```
public/index.html        App (UI Navision-style, wire supabase-js v2 qua CDN)
public/env.example.js    Mẫu cấu hình → copy thành env.js
supabase/migrations/0001_init.sql   Schema + RLS + storage bucket
supabase/seed.sql        17 NCC mẫu + 4.527 MST nợ thuế
vercel.json              Cấu hình host tĩnh (outputDirectory = public)
```

## Bước 1 — Tạo Supabase project
1. supabase.com → New project (chọn region gần VN, vd Singapore). Ghi lại DB password.
2. Vào **SQL Editor** → dán toàn bộ `supabase/migrations/0001_init.sql` → **Run**.
   - Tạo bảng: vendor, vendor_contact, vendor_alias, vendor_document, tax_risk_registry
   - Bật RLS (chỉ user đăng nhập truy cập) + tạo bucket Storage `vendor-docs`.
3. SQL Editor → dán `supabase/seed.sql` → **Run** (nạp NCC mẫu + danh sách nợ thuế).
   - File ~200KB; nếu editor báo quá lớn, chia làm 2 lần chạy (phần vendor, rồi phần registry).

## Bước 2 — Tạo user đăng nhập
Authentication → **Users** → Add user (email + password). App dùng email/password.
(Có thể tắt "Confirm email" trong Auth → Providers → Email để user đăng nhập ngay.)

## Bước 3 — Lấy khoá API
Project Settings → **API**: copy **Project URL** và **anon public key**.

## Bước 4 — Chạy thử local
```bash
cp public/env.example.js public/env.js   # điền URL + anon key
cd public && python3 -m http.server 8080 # mở http://localhost:8080
```

## Bước 5 — Deploy Vercel
- Đẩy repo lên GitHub → Vercel → New Project → import repo.
- **KHÔNG** commit `public/env.js` (đã .gitignore). Trên Vercel tạo file env.js bằng 1 trong 2 cách:
  - **Cách A (đơn giản):** bỏ dòng `public/env.js` khỏi .gitignore và commit env.js với anon key
    (anon key vốn dành cho client, an toàn khi đã bật RLS).
  - **Cách B:** thêm 1 build step nhỏ sinh env.js từ Environment Variables của Vercel.
- Deploy. Xong.

## Bước 6 — Bật "Điền tự động từ AI" (Gemini, chạy hoàn toàn phía trình duyệt)
Trong tab hồ sơ NCC → **Hồ sơ đính kèm**, chọn ảnh/PDF Giấy phép KD ở ô tệp là Gemini tự đọc
(vision) và điền ngay Tên NCC, MST, Số GPKD, Địa chỉ, Người đại diện pháp luật, Chức vụ — không
cần bấm thêm nút nào. Gọi thẳng Gemini API từ trình duyệt, không qua server. Kết quả AI luôn cần
kiểm tra lại trước khi bấm Lưu.

Mỗi người dùng tự cấu hình key riêng, **không cần deploy gì thêm**:
1. Lấy API key miễn phí tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Trong app, bấm nút **🔑 Gemini** ở góc trên phải → dán key → **Lưu**.
3. Key chỉ lưu trong `localStorage` của trình duyệt đó (theo từng máy/từng người), gọi thẳng tới
   `generativelanguage.googleapis.com` — không đi qua server của app, admin không thấy được key.

Lưu ý bảo mật: vì key nằm ở phía client (hiện trong DevTools/Network tab của người dùng), chỉ nên
dùng key Gemini free-tier / giới hạn riêng cho việc này, không dùng chung key có quota lớn.

*(Thư mục `supabase/functions/extract-doc/` là bản cũ dùng Claude qua Edge Function — không còn
được gọi tới, có thể xoá nếu không dùng.)*

## Bảo mật
- **anon key** để lộ là bình thường — an toàn nhờ **RLS** (mọi bảng chỉ cho `authenticated`).
- Tuyệt đối KHÔNG đưa `service_role` key vào front-end.
- Muốn phân quyền sâu hơn (chỉ Purchasing sửa được), thay policy `p_all` bằng policy theo role/claim.

## Tính năng
- CRUD NCC, vòng đời trạng thái (Draft → Pending → Active…), điều kiện Active
  (MST hợp lệ + đủ 3 posting group + ≥1 liên hệ có email).
- Dedup theo MST (khóa tự nhiên, unique index).
- **Cảnh báo rủi ro nợ thuế**: query `tax_risk_registry` theo MST; cập nhật danh sách qua màn Tax Risk Registry.
- Trường mở rộng: người ĐDPL, khách hàng tiêu biểu, Supplier Assessment (SA), Tender Evaluation (TE), loại hợp đồng.
- Đính kèm hồ sơ NCC → Supabase Storage (`vendor-docs`).

## Còn thiếu (bước sau)
- Đẩy dữ liệu xuống Nav/Vista qua API: dùng bảng field-mapping đã dựng (G-ERP → Nav → Vista).
- Module Item/BOM: cần crosswalk **Vista numeric ItemId ↔ HO code** trước khi ráp.
