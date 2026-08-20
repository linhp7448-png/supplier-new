# Phase 2 — GALAXY-SCM → supplier-new reconciliation

Trạng thái: dry-run trên `GALAXY-SCM/galaxy_scm_raw_data.json`. Database chưa được deploy hoặc thay đổi từ workspace này.

## Kết quả chuẩn hóa

| Kiểm tra | Legacy | Canonical | Kết quả |
|---|---:|---:|---|
| Raw lineage | 2.711 dòng | 2.711 lineage | Không mất dòng nguồn |
| Item | 247 | 247 | Giữ nguyên Item chức năng |
| Sub Item | 505 nhóm theo Item + Vendor | 294 biến thể vật lý | Loại vendor khỏi định danh Sub Item |
| Supplier Offer | — | 505 | Một Vendor × một Sub Item |
| Offer–Location | 2.705 dòng hợp lệ | 2.703 khóa duy nhất | Gom 2 nhóm trùng |
| Biến thể đa nhà cung cấp | Bị nhân bản | 72 Sub Item dùng chung | Vendor được tách sang Offer |

Hai Item thiếu vendor (`HOTHITBOXAY`, `HOTHITHEOXAY`) vẫn tạo Item/Sub Item để tra cứu, nhưng không tạo Supplier Offer giả.

## Validation debt

| Mã lỗi | Số lượng | Cách xử lý |
|---|---:|---|
| `MISSING_VENDOR` | 6 raw rows | Giữ lineage; chờ gán vendor |
| `UNMATCHED_VENDOR` | 13 vendor codes | Đối chiếu/tạo NCC trong Supplier Management trước khi backfill DB |
| `INCONSISTENT_ITEM_DESCRIPTION` | 3 Item | Owner xác nhận tên chuẩn |
| `INCONSISTENT_VENDOR_NAME` | 1 vendor code | Supplier Management là nguồn tên chuẩn |
| `DUPLICATE_OFFER_LOCATION` | 2 nhóm | Gom về một Offer–Location và giữ `source_row_count` |

Các mã Item có mô tả chưa đồng nhất: `HOBANHREDVELVET`, `HOCHOCOMUFFIN`, `HOGIAMGAO`.

## Điều kiện nghiệm thu khi chạy database

```sql
select * from public.mdm_item_reconciliation;
```

Kỳ vọng sau khi 13 vendor code đã tồn tại trong bảng `vendor`:

- `item_count = 247`
- `sub_item_count = 294`
- `offer_count = 505`
- `offer_location_count = 2703`
- `lineage_count = 2711`

`open_issue_count` có thể lớn hơn 8 vì migration còn ghi nhận conversion/base-UOM không hợp lệ nếu database thực tế có thêm validation debt ngoài fixture.
