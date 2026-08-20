'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Downstream = require('../public/js/item-management/downstream.js');

const root = path.resolve(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/0006_downstream_sync.sql'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

assert.strictEqual(Downstream.target('nav'), 'NAV2017');
assert.strictEqual(Downstream.target('vista'), 'VISTA');
assert.strictEqual(Downstream.target('unknown'), '');

const summary = Downstream.summarize([
  { target_system: 'NAV2017', status: 'Pending' },
  { target_system: 'NAV2017', status: 'Synced' },
  { target_system: 'VISTA', status: 'Blocked' },
  { target_system: 'VISTA', status: 'Failed' },
  { target_system: 'VISTA', status: 'Processing' }
]);
assert.deepStrictEqual(
  { total: summary.total, waiting: summary.waiting, attention: summary.needsAttention, synced: summary.Synced },
  { total: 5, waiting: 2, attention: 2, synced: 1 }
);

const validCrosswalk = Downstream.validateCrosswalk([
  { target_system: 'NAV2017', entity_type: 'Item', canonical_code: 'ITM-1', external_id: '100' },
  { target_system: 'VISTA', entity_type: 'Sub_Item', canonical_code: 'SUB-1', external_id: '200' }
]);
assert.strictEqual(validCrosswalk.ok, true);
const duplicateCrosswalk = Downstream.validateCrosswalk([
  { target_system: 'VISTA', entity_type: 'Item', canonical_code: 'ITM-1', external_id: '100' },
  { target_system: 'VISTA', entity_type: 'Item', canonical_code: 'ITM-2', external_id: '100' }
]);
assert.strictEqual(duplicateCrosswalk.ok, false);
assert(duplicateCrosswalk.issues.some(issue => issue.code === 'DUPLICATE_EXTERNAL'));

const groups = Downstream.mappingGroups([
  { target_system: 'NAV2017', entity_type: 'Item', canonical_field: 'name', sync_order: 20, active: true },
  { target_system: 'NAV2017', entity_type: 'Item', canonical_field: 'code', sync_order: 10, active: true }
]);
assert.strictEqual(groups['NAV2017|Item'][0].canonical_field, 'code');

const request = Downstream.dispatchRequest({
  event_id: 'event-1', event_key: 'NAV2017:Item:ITM-1:REQ-1:Upsert',
  target_system: 'NAV2017', operation: 'Upsert', entity_type: 'Item',
  canonical_code: 'ITM-1', external_id: '100', payload: { schema_version: '1.0', data: { item_code: 'ITM-1' } }
}, 'https://adapter.example.test/');
assert.strictEqual(request.method, 'POST');
assert.strictEqual(request.headers['Idempotency-Key'], 'NAV2017:Item:ITM-1:REQ-1:Upsert');
assert.strictEqual(request.url, 'https://adapter.example.test/v1/master-data/nav2017');
assert.throws(() => Downstream.dispatchRequest({ event_key: 'x', target_system: 'VISTA', payload: {} }, 'http://unsafe.test'));

[
  'mdm_downstream_field_mapping',
  'mdm_downstream_crosswalk',
  'mdm_downstream_outbox',
  'mdm_downstream_sync_audit',
  'mdm_enqueue_downstream',
  'mdm_retry_downstream_event',
  'mdm_claim_downstream_events',
  'mdm_complete_downstream_event'
].forEach(token => assert(migration.includes(token), `Migration must include ${token}`));

assert(/after update of status[\s\S]*new\.status = 'Approved'/i.test(migration), 'Approved transition must enqueue in the same transaction');
assert(/event_key text not null unique/i.test(migration), 'Outbox must enforce idempotency');
assert(/for update skip locked/i.test(migration), 'Workers must claim events safely');
assert(/status = 'Processing'[\s\S]*interval '15 minutes'/i.test(migration), 'Expired worker leases must be recoverable');
assert(/Crosswalk cannot change while an event is Processing/i.test(migration));
assert(/auth\.jwt\(\) ->> 'role'[\s\S]*service_role/i.test(migration), 'Worker RPCs must require service role');
assert(/revoke all on function public\.mdm_claim_downstream_events[\s\S]*authenticated/i.test(migration));
assert(/public\.mdm_current_role\(\) not in \('Approver', 'Admin'\)/i.test(migration));
assert(/status in \('Pending', 'Processing', 'Synced', 'Failed', 'Blocked'\)/i.test(migration));
assert(!/https?:\/\//i.test(migration), 'Migration must not embed downstream endpoints');

assert(html.includes('js/item-management/downstream.js'));
assert(html.includes("imTab(\\'sync\\')"));
assert(html.includes('mdm_upsert_downstream_crosswalk'));
assert(html.includes('mdm_retry_downstream_event'));
assert(!html.includes('Chờ downstream sync</span><b style="color:var(--blue)">12</b>'), 'UI must not hard-code pending sync count');
assert(readme.includes('0006_downstream_sync.sql'));
assert(readme.includes('PHASE4_DOWNSTREAM.md'));

console.log('Phase 4 downstream checks passed.');
