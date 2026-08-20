const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const workflow = require('../public/js/item-management/workflow.js');
const search = require('../public/js/item-management/search.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase', 'migrations', '0005_item_workflow.sql'), 'utf8');
const workflowSource = fs.readFileSync(path.join(root, 'public', 'js', 'item-management', 'workflow.js'), 'utf8');

assert.deepEqual(workflow.capabilities('Viewer', true), {
  canSearch: true, canSubmit: false, canApprove: false, canManageImages: false
});
assert.equal(workflow.capabilities('Buyer', true).canSubmit, true);
assert.equal(workflow.capabilities('Buyer', false).canSubmit, false, 'legacy fallback must be read-only');
assert.equal(workflow.capabilities('Approver', true).canApprove, true);
assert.equal(workflow.capabilities('Admin', true).canManageImages, true);

const item = { 'Item Code': 'ITM1', 'Functional UOM': 'ml', Domain: 'F&B' };
const validSub = {
  mode: 'sub_item', requestedName: 'Milk', itemCode: 'ITM1', brand: 'Brand A',
  purchaseUom: 'chai', conversionFactor: 1000, baseUom: 'ml', domain: 'F&B', exactOnly: false
};
assert.deepEqual(workflow.validate(validSub, item), []);
assert.equal(workflow.classify(validSub), 'Add_Sub_Item');
assert.equal(workflow.approvalDecision(validSub, item).autoApproved, true);
assert.equal(workflow.approvalDecision({ ...validSub, exactOnly: true }, item).autoApproved, false);
assert.equal(workflow.classify({ ...validSub, replacedSubItemCode: 'OLD' }), 'Replace_Sub_Item');
assert.equal(workflow.approvalDecision({ ...validSub, replacedSubItemCode: 'OLD' }, item).autoApproved, false);
assert.equal(workflow.classify({ mode: 'offer', existingSubItemCode: 'SUB1' }), 'Add_Offer');
assert.equal(workflow.classify({ mode: 'content', existingSubItemCode: 'SUB1' }), 'Update_Content');
assert.ok(workflow.validate({ ...validSub, itemCode: '', categoryCode: '' }, null).some(error => error.includes('Category')));
assert.ok(workflow.validate({ ...validSub, purchaseUom: 'ml' }, item).length > 0, 'purchase UOM ml must be rejected');
assert.ok(workflow.validateImages(Array.from({ length: 6 }, (_, index) => ({ name: index + '.png', type: 'image/png', size: 1 }))).length > 0);
assert.ok(workflow.validateImages([{ name: 'bad.pdf', type: 'application/pdf', size: 1 }]).length > 0);
assert.deepEqual(workflow.validateImages([{ name: 'ok.webp', type: 'image/webp', size: 1024 }]), []);

const data = {
  items: [{ 'Item Code': 'ITM1', 'Item Name / Functional Spec': 'Fresh Milk', 'Category Code': 'DAIRY' }],
  subItems: [{ 'Item Code': 'ITM1', 'Sub Item Code': 'SUB1', 'Sub Item Name': 'Milk 1L', Brand: 'Brand A', Status: 'Active', 'Primary Image': 'https://example.test/milk.png' }],
  offers: [{ 'Sub Item Code': 'SUB1', 'Vendor Code': 'V1', 'Vendor Name': 'Vendor One', 'Location Code': 'LOC-A', Locations: ['LOC-A'] }],
  content: [{ 'Sub Item Code': 'SUB1', 'Display Name': 'Fresh Milk 1L' }],
  replacements: [{ old_sub_item_code: 'OLD', new_sub_item_code: 'SUB1' }]
};
assert.equal(search.search(data, 'Vendor One').length, 1, 'search must include Supplier Offer');
assert.equal(search.search(data, 'LOC-A').length, 1, 'search must include location');
assert.equal(search.search(data, 'Brand A').length, 1, 'search must include physical variant');
assert.equal(search.search(data, 'unknown').length, 0);
assert.equal(search.subItem(data, 'SUB1').row.offers.length, 1);

assert.match(migration, /create table if not exists public\.mdm_sub_item_replacement/i);
assert.match(migration, /create or replace function public\.mdm_submit_item_intake/i);
assert.match(migration, /create or replace function public\.mdm_approve_request/i);
assert.match(migration, /security definer/gi);
assert.match(migration, /submission_key/i, 'workflow must be idempotent');
assert.match(migration, /p_category_code text default null/i, 'new Item workflow must carry an explicit Category for owner confirmation');
assert.match(migration, /drop policy if exists mdm_request_insert/i, 'direct request insert must be blocked');
assert.match(migration, /set status = 'Inactive'[\s\S]*replaced_sub_item_code/i, 'replacement must inactivate old Sub Item');
assert.match(migration, /update public\.mdm_supplier_offer set status = 'Inactive'/i, 'replacement must preserve and inactivate old offers');
assert.match(migration, /set status = 'Inactive', is_primary = false[\s\S]*remove_image_value::uuid/i, 'approved content request must deactivate selected images');
assert.match(migration, /primary_image_value[\s\S]*set is_primary = true/i, 'approved content request must support selecting a primary image');
assert.match(migration, /check \(old_sub_item_code <> new_sub_item_code\)/i);
assert.match(migration, /revoke all on function public\.mdm_materialize_item_request/i, 'internal materializer must not be callable by clients');
assert.match(migration, /^begin;[\s\S]*commit;\s*$/im, 'migration must be transactional');

assert.match(workflowSource, /storage\.from\('item_images'\)/, 'Product Content images must use item_images');
assert.doesNotMatch(workflowSource, /vendor-docs/, 'Item workflow must not use supplier document storage');
assert.match(html, /Tra cứu sản phẩm/);
assert.match(html, /Màn tra cứu chỉ hiển thị dữ liệu canonical/);
assert.doesNotMatch(html, /Quản lý mặt hàng \(ảnh SP\)/, 'separate product-image navigation must be removed');
assert.match(html, /imSmartOpenForSub/);
assert.match(html, /p_replaced_sub_item_code/);
assert.match(html, /p_image_paths/);
assert.match(html, /p_primary_image_id/);
assert.match(html, /p_remove_image_ids/);
assert.doesNotMatch(html, /Nhập SCM từ Excel/);

console.log('Phase 3 workflow checks passed.');
