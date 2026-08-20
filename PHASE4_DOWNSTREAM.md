# Phase 4 — NAV2017/Vista downstream boundary

Trạng thái: đã triển khai trong source; chưa chạy migration, cấu hình worker hoặc deploy.

## Kiến trúc

Luồng dữ liệu là một chiều:

`Approved Item Request → canonical master → transactional outbox → verified crosswalk → service-role adapter → NAV2017/Vista`

- G-ERP là nguồn chuẩn. NAV2017/Vista không ghi ngược vào canonical Item Management.
- Trigger outbox chạy trong cùng transaction với việc request chuyển sang `Approved`.
- Thiếu crosswalk `Verified` làm event chuyển thành `Blocked`; hệ thống không đoán external ID.
- Frontend chỉ đọc trạng thái, xác minh crosswalk và yêu cầu retry qua RPC. Frontend không claim event, không giữ credential và không gọi endpoint downstream.
- Worker adapter dùng service-role để claim/complete event và gửi `event_key` làm idempotency key.

## Bảng dữ liệu

| Bảng | Mục đích |
|---|---|
| `mdm_downstream_field_mapping` | Contract canonical field → NAV/Vista field |
| `mdm_downstream_crosswalk` | HO Item/Sub-item code ↔ external ID |
| `mdm_downstream_outbox` | Payload snapshot và trạng thái dispatch |
| `mdm_downstream_sync_audit` | Nhật ký enqueue, crosswalk, retry và dispatch |

Trạng thái outbox: `Pending → Processing → Synced` hoặc `Failed`; thiếu mapping dùng `Blocked`.

## Adapter contract

Worker chỉ được dùng hai RPC service-role:

1. `mdm_claim_downstream_events(target, worker_id, limit)` claim bằng `FOR UPDATE SKIP LOCKED`.
2. Gửi payload tới adapter NAV/Vista với header `Idempotency-Key = event_key`.
3. `mdm_complete_downstream_event(event_id, worker_id, success, response, error)` ghi kết quả.

Retry lỗi có exponential backoff tối đa 60 phút. Approver/Admin có thể đưa event `Failed/Blocked` về `Pending` sau khi sửa crosswalk.

## Rollout runbook

1. Backup schema và chụp số lượng Item/Sub-item/Request theo trạng thái.
2. Chạy migration theo thứ tự `0001` → `0006` trên staging.
3. Kiểm tra các bảng Phase 4 và policy chỉ-read cho user đăng nhập.
4. Đối soát field mapping với owner NAV2017/Vista.
5. Tạo/xác minh crosswalk cho pilot Item/Sub-item.
6. Kiểm tra payload outbox; chưa bật worker.
7. Cấu hình endpoint/credential trong secret store của worker, không lưu trong repo hoặc frontend.
8. Bật worker cho một target và một nhóm pilot; đối soát external ID và payload hash.
9. Mở rộng dần, theo dõi `Failed/Blocked` và audit log.

## Safe rollback

Rollback vận hành không xóa dữ liệu:

1. Dừng worker adapter.
2. Disable trigger `trg_mdm_request_downstream_outbox` nếu cần ngừng tạo event mới.
3. Giữ nguyên outbox/audit để điều tra và reconciliation.
4. Canonical Item Management và workflow Phase 1–3 tiếp tục hoạt động độc lập.
5. Chỉ drop bảng/hàm Phase 4 sau khi có backup và change approval riêng.

## Reconciliation queries

```sql
select target_system, status, count(*)
from mdm_downstream_outbox
group by target_system, status
order by target_system, status;

select target_system, entity_type, canonical_code, last_error
from mdm_downstream_outbox
where status in ('Failed', 'Blocked')
order by created_at;

select target_system, entity_type, external_id, count(*)
from mdm_downstream_crosswalk
where status <> 'Inactive'
group by target_system, entity_type, external_id
having count(*) > 1;
```

## Verification

```bash
npm test
```

Test Phase 4 kiểm tra crosswalk conflict, outbox status, idempotency, service-role boundary, field mapping, adapter request contract và việc UI không còn số downstream hard-code.
