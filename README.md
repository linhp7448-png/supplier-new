# G-ERP · Supplier Management — Supabase + Vercel

App quản lý nhà cung cấp (nguồn chuẩn MDM cho Galaxy Cinema). Frontend tĩnh nối
Supabase (Postgres + Auth + Storage). Không cần build step.

## Nội dung
```
public/index.html        App (UI Navision-style, wire supabase-js v2 qua CDN)
public/env.example.js    Mẫu cấu hình → copy thành env.js
supabase/migrations/0001_init.sql   Supplier + legacy SCM schema
supabase/migrations/0002_add_fields.sql   Supplier fields
supabase/migrations/0003_item_management.sql   Canonical Item Management + RLS
supabase/migrations/0004_item_management_backfill.sql   Idempotent GALAXY backfill
supabase/migrations/0005_item_workflow.sql   Item request/approval/image/replacement workflow
supabase/migrations/0006_downstream_sync.sql   NAV/Vista crosswalk + transactional outbox
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

### Bật Item Management hợp nhất

Chạy migration theo đúng thứ tự `0001` → `0002` → `0003` → `0004` → `0005` → `0006`.

- `0003` tạo canonical Item, Sub Item, Supplier Offer, Offer–Location, Product Content/Image và lineage.
- `0004` backfill trực tiếp từ `raw_data`; không có bước import file từ giao diện.
- `0005` tạo RPC submit/approve/reject, idempotency, ảnh Product Content và lịch sử thay thế Sub Item.
- `0006` tạo field mapping, crosswalk và transactional outbox cho NAV2017/Vista. Migration không chứa credential và không tự gọi API downstream.
- `raw_data` được giữ nguyên làm bằng chứng legacy và có thể chạy lại `0004` an toàn.
- Sau khi chạy, kiểm tra `select * from mdm_item_reconciliation;`.
- Phải seed ít nhất một email `Admin` vào `app_role` bằng SQL Editor/service role trước khi quản trị master data. Không đưa service-role key vào frontend.

Reconciliation dry-run trên bộ dữ liệu GALAXY nằm tại `PHASE2_RECONCILIATION.md`.
Workflow/role matrix Phase 3 nằm tại `PHASE3_WORKFLOW.md`.
Contract và runbook Phase 4 nằm tại `PHASE4_DOWNSTREAM.md`.
Staging preflight/UAT matrix Phase 5 nằm tại `PHASE5_UAT.md`.

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
- Cấu hình worker/adapter bằng specification và credential thật của NAV2017/Vista. Frontend không giữ credential downstream.
- Chạy UAT migration `0006`, xác minh crosswalk và đối soát payload trước khi bật worker dispatch.
