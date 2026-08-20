const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildCanonical } = require('./canonical-model.cjs');

const root = path.resolve(__dirname, '..');
const schema = fs.readFileSync(path.join(root, 'supabase', 'migrations', '0003_item_management.sql'), 'utf8');
const backfill = fs.readFileSync(path.join(root, 'supabase', 'migrations', '0004_item_management_backfill.sql'), 'utf8');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
const galaxy = JSON.parse(fs.readFileSync(path.join(root, '..', 'GALAXY-SCM', 'galaxy_scm_raw_data.json'), 'utf8'));
const supplierVendors = JSON.parse(fs.readFileSync(path.join(root, 'vendors_data.json'), 'utf8'));

[
  'mdm_category',
  'mdm_item',
  'mdm_sub_item',
  'mdm_product_content',
  'mdm_product_image',
  'mdm_supplier_offer',
  'mdm_supplier_offer_location',
  'mdm_item_request',
  'mdm_legacy_lineage',
  'mdm_data_issue',
  'mdm_migration_run'
].forEach(function (table) {
  assert.match(schema, new RegExp('create table if not exists public\\.' + table + '\\b', 'i'), table + ' must be in canonical schema');
  assert.match(schema, new RegExp("'" + table + "'"), table + ' must be covered by RLS setup');
});

assert.match(schema, /unique\s*\(physical_fingerprint\)/i, 'physical variants need a canonical uniqueness rule');
assert.match(schema, /unique\s*\(sub_item_code, vendor_code\)/i, 'one offer per vendor and physical sub item');
assert.match(schema, /primary key\s*\(offer_id, location_code\)/i, 'offer locations must not duplicate');
assert.match(schema, /mdm_can_manage_master/i, 'master writes must use role-based authorization');
assert.doesNotMatch(schema, /for all to authenticated using\s*\(true\)/i, 'canonical master tables must not be writable by every authenticated user');
assert.match(schema, /drop policy if exists p_all on public\.%I[\s\S]*legacy_manage/i, 'legacy SCM writes must be restricted after backfill');
assert.match(backfill, /GALAXY_SCM_CANONICAL_V1/, 'backfill needs a stable idempotency key');
assert.match(backfill, /on conflict\s*\(physical_fingerprint\)/i, 'backfill must upsert physical variants');
assert.match(backfill, /mdm_legacy_lineage/i, 'backfill must preserve raw lineage');
assert.doesNotMatch(backfill, /delete\s+from\s+public\.raw_data|truncate\s+.*raw_data/i, 'legacy evidence must remain untouched');

assert.match(html, /imLoadLegacyFallback/, 'legacy fallback must remain explicit during transition');
assert.match(html, /Supabase · Item Management canonical/, 'loader must identify canonical source');
assert.match(html, /imFetchAll\('mdm_supplier_offer_location'/, 'loader must use normalized offer locations');
assert.match(html, /imFetchAll\('mdm_product_image'/, 'loader must read Product Content images');
assert.doesNotMatch(html, /Nhập SCM từ Excel/, 'Phase 2 must not restore user-facing SCM import');

const knownVendorCodes = new Set(supplierVendors.map(vendor => vendor.code));
const canonical = buildCanonical(galaxy.rows, { knownVendorCodes });
const issueCount = function (code) {
  return canonical.issues.filter(issue => issue.issueCode === code).length;
};
const uniqueIssueKeys = function (code) {
  return new Set(canonical.issues.filter(issue => issue.issueCode === code).map(issue => issue.sourceKey));
};

assert.equal(galaxy.rows.length, 2711, 'source fixture count changed');
assert.equal(canonical.items.length, 247, 'canonical Item count');
assert.equal(canonical.subItems.length, 294, 'vendor-independent physical Sub Item count');
assert.equal(canonical.offers.length, 505, 'Supplier Offer count');
assert.equal(canonical.offerLocations.length, 2703, 'deduplicated Offer–Location count');
assert.equal(canonical.lineage.length, galaxy.rows.length, 'every raw row must retain lineage');
assert.equal(issueCount('MISSING_VENDOR'), 6, 'rows missing vendor');
assert.equal(issueCount('DUPLICATE_OFFER_LOCATION'), 2, 'duplicate Offer–Location groups');
assert.equal(issueCount('INCONSISTENT_ITEM_DESCRIPTION'), 3, 'items with conflicting descriptions');
assert.equal(issueCount('INCONSISTENT_VENDOR_NAME'), 1, 'vendor codes with conflicting names');
assert.equal(uniqueIssueKeys('UNMATCHED_VENDOR').size, 13, 'vendor codes absent from supplier-new fixture');

assert.equal(new Set(canonical.subItems.map(item => item.subItemCode)).size, canonical.subItems.length, 'Sub Item codes must be unique');
assert.equal(new Set(canonical.offers.map(offer => offer.offerId)).size, canonical.offers.length, 'Offer IDs must be unique');
assert.equal(new Set(canonical.offerLocations.map(location => location.offerId + '|' + location.locationCode)).size, canonical.offerLocations.length, 'Offer–Location keys must be unique');

const multiVendorSubItems = new Map();
canonical.offers.forEach(function (offer) {
  if (!multiVendorSubItems.has(offer.subItemCode)) multiVendorSubItems.set(offer.subItemCode, new Set());
  multiVendorSubItems.get(offer.subItemCode).add(offer.vendorCode);
});
assert.equal(Array.from(multiVendorSubItems.values()).filter(vendors => vendors.size > 1).length, 72, 'multi-vendor physical variants must reuse one Sub Item');

console.log('Phase 2 canonical checks passed:');
console.log('  2711 raw rows -> 247 items, 294 physical sub items, 505 offers, 2703 offer-locations.');
console.log('  Validation debt: 6 missing-vendor rows, 13 unmatched vendor codes, 3 item-description conflicts, 1 vendor-name conflict, 2 duplicate offer-location groups.');
