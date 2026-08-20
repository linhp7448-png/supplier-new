# Phase 5 — Staging UAT & Cutover

Trạng thái: preflight đang thực hiện; chưa xác định staging target, chưa chạy migration hoặc deploy.

## Preflight findings

- `public/index.html` trước đây hard-code project ref `qwzmnfzrguffzerbajpw`, trong khi `public/env.js` dùng project ref `ugsqnmgwjahlonyvbczc`.
- Read-only anonymous schema probe ngày 2026-08-20:
  - `qwzmnfzrguffzerbajpw`: `mdm_item` trả HTTP 404.
  - `ugsqnmgwjahlonyvbczc`: `mdm_item` trả HTTP 200.
- Repo và git history không gắn nhãn staging/production cho hai project.
- Source đã được sửa để `index.html` chỉ nạp `env.js`; không còn hard-code Supabase project trong HTML.
- Máy hiện tại chưa có `psql`, Supabase CLI hoặc Docker. Cần một migration channel đã xác thực trước khi chạy SQL staging.

Không dùng credential demo trong source để đăng nhập project cho đến khi owner xác nhận target. Không dán database password hoặc service-role key vào source/chat.

## Required staging inputs

1. Project ref được xác nhận là staging.
2. Migration channel: Supabase CLI đã login/link, database URL qua secret environment, hoặc owner chạy SQL trong Dashboard.
3. Backup/restore owner và vị trí lưu evidence.
4. Tài khoản UAT cho `Admin`, `Approver`, `Buyer`, `Viewer`.
5. NAV2017/Vista sample external IDs và field-contract owner.

## UAT matrix

| Case | Role | Expected result |
|---|---|---|
| Create Item | Buyer → Approver | Pending rồi Approved; Item/Sub-item/outbox được tạo |
| Add Sub-item an toàn | Buyer | Auto-approved nếu domain/UOM hợp lệ |
| Add Supplier Offer | Buyer | Auto-approved nếu vendor/Sub-item hợp lệ |
| Update Content/Image | Buyer → Approver | Search chỉ đọc; content/primary image đổi sau approval |
| Replace Sub-item | Buyer → Approver | Sub-item/offer cũ Inactive; replacement history và Deactivate event tồn tại |
| Duplicate submission | Buyer | Cùng submission key không tạo request/event trùng |
| Reject request | Approver | Bắt buộc lý do; canonical không thay đổi |
| Missing crosswalk | Approver/Admin | Outbox Blocked, không dispatch |
| Verified crosswalk | Approver/Admin | Event chuyển Pending |
| Retry Failed | Approver/Admin | Payload được rebuild và event trở lại Pending |
| Direct master write | Buyer/Viewer | Bị RLS từ chối |
| Claim/complete event | Authenticated user | Bị từ chối; chỉ service-role worker được phép |

## Evidence template

Mỗi case cần ghi: timestamp, environment/project ref, tester/role, request number, canonical codes, outbox event IDs, expected/actual, screenshot hoặc query result, pass/fail và defect link.

## Go/no-go gate

Go khi migration/backup đã xác nhận, regression + UAT critical pass, không còn duplicate/crosswalk conflict, rollback drill đạt và monitoring owner được chỉ định. Production deployment và credential activation cần approval riêng.
