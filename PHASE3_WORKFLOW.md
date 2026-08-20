# Phase 3 — Item Management workflow

Trạng thái: đã triển khai trong source; chưa chạy migration hoặc deploy database.

## Information architecture

- **Tra cứu sản phẩm:** read-only, tổng hợp Item → Sub Item → Product Content/Image → Supplier Offer → Location.
- **Thêm / thay sản phẩm:** nơi duy nhất tạo request thay đổi. Không có tab SCM hoặc tab Hình ảnh riêng.
- **Golden Record:** màn kiểm soát dữ liệu; không ghi trực tiếp canonical tables.

## Request types

| Request | Kết quả | Auto-approve |
|---|---|---|
| `Create_Item` | Item + Sub Item + Content/ảnh + Offer tùy chọn | Không |
| `Add_Sub_Item` | Biến thể vật lý mới trong Item hiện hữu | Có, nếu domain/UOM hợp lệ và không exact-only |
| `Add_Offer` | Gắn NCC vào Sub Item hiện hữu | Có, nếu NCC và Sub Item hợp lệ |
| `Update_Content` | Đổi tên hiển thị, brand/manufacturer, thêm/gỡ/chọn ảnh chính | Không |
| `Replace_Sub_Item` | Tạo Sub Item mới, chuyển Sub Item/Offer cũ sang `Inactive`, lưu old→new | Không |

Mọi submit có `submission_key` để chống gửi trùng. Client không được gọi trực tiếp hàm materialize hoặc insert thẳng `mdm_item_request`.

## Role matrix

| Role | Tra cứu | Gửi request | Duyệt/từ chối | Quản trị ảnh/master |
|---|---:|---:|---:|---:|
| Viewer | ✓ | — | — | — |
| Buyer | ✓ | ✓ | — | Qua request |
| Approver | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✓ |

Khi canonical tables chưa sẵn sàng, legacy fallback chỉ cho phép tra cứu.

## Product Content images

- Bucket: `item_images`.
- Tối đa 5 ảnh/request, mỗi ảnh tối đa 5 MB.
- MIME: JPG, PNG, WEBP, GIF.
- Hỗ trợ thêm nhiều ảnh, chọn ảnh chính và gỡ ảnh qua request `Update_Content`.
- Màn tra cứu chỉ đọc ảnh chính/gallery; không chỉnh sửa tại chỗ.

## Verification

```bash
npm test
```

Test contract bao phủ role/canonical fallback, validation UOM, idempotency, auto-approve, replacement history, image storage/primary/removal, search theo Item/Sub Item/NCC/Location và khóa import SCM.
