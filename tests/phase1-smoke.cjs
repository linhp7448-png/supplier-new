const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const adapter = require('../public/js/item-management/scm-adapter.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');

function count(pattern) {
  return (html.match(pattern) || []).length;
}

assert.equal(count(/id=["']scmFileInput["']/g), 0, 'SCM import input must be removed');
assert.equal(count(/SCM IMPORT LOGIC/g), 0, 'SCM import handlers must be removed');
assert.equal(count(/Nhập SCM từ Excel/g), 0, 'SCM import action must be removed from the toolbar');
assert.equal(count(/function\s+itemMgmtView\s*\(/g), 1, 'itemMgmtView must have one implementation');
assert.equal(count(/function\s+imTabs\s*\(/g), 1, 'imTabs must have one implementation');
assert.equal(count(/function\s+imTab\s*\(/g), 1, 'imTab must have one implementation');
assert.equal(count(/function\s+imRender\s*\(/g), 1, 'imRender must have one implementation');
assert.equal(count(/function\s+loadScmIntoIMD\s*\(/g), 1, 'loadScmIntoIMD must have one implementation');
assert.equal(count(/<script[^>]+src=["'][^"']*xlsx[^"']*\.min\.js["']/gi), 1, 'SheetJS must load once');
assert.match(html, /js\/item-management\/scm-adapter\.js/, 'SCM adapter must be loaded');

const inlineScripts = Array.from(html.matchAll(/<script(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi));
inlineScripts.forEach(function (match, index) {
  assert.doesNotThrow(function () { new Function(match[1]); }, 'inline script ' + (index + 1) + ' must parse');
});

const rawRows = [
  { rid: 'r1', item_no: 'ITEM1', vendor_code: 'V1', loc_code: 'LOC-A', sub_desc: 'Milk 1L', brand: 'A', purch_unit: 'box', conversion: 1, base_unit: 'l', hsd: 10, storage: 'Chilled', items: { description: 'Milk', category: 'F&B' }, vendor: { name: 'Vendor One' } },
  { rid: 'r2', item_no: 'ITEM1', vendor_code: 'V1', loc_code: 'LOC-B', sub_desc: 'Milk 1L', brand: 'A', purch_unit: 'box', conversion: 1, base_unit: 'l', hsd: 10, storage: 'Chilled', items: { description: 'Milk', category: 'F&B' }, vendor: { name: 'Vendor One' } },
  { rid: 'r3', item_no: 'ITEM1', vendor_code: 'V1', loc_code: 'LOC-A', sub_desc: 'Milk 1L Brand B', brand: 'B', purch_unit: 'box', conversion: 1, base_unit: 'l', hsd: 10, storage: 'Chilled', items: { description: 'Milk', category: 'F&B' }, vendor: { name: 'Vendor One' } }
];

const mapped = adapter.mapRows(rawRows);
assert.equal(mapped.items.length, 1, 'one legacy item should map to one item');
assert.equal(mapped.subItems.length, 2, 'locations must not create duplicate sub items');
assert.equal(mapped.offers.length, 2, 'one offer should be created per physical variant');
assert.equal(new Set(mapped.subItems.map(x => x['Sub Item Code'])).size, 2, 'sub item codes must be unique');
assert.deepEqual(mapped.subItems[0]._scmRids.concat(mapped.subItems[1]._scmRids).sort(), ['r1', 'r2', 'r3']);
assert.ok(mapped.offers.some(x => x['Locations'].length === 2), 'offer locations must be aggregated');

const target = {
  items: [{ 'Item Code': 'MASTER1' }, { 'Item Code': 'OLD', _is_scm: true }],
  subItems: [{ 'Item Code': 'MASTER1', 'Sub Item Code': 'MASTER1-001' }, { 'Sub Item Code': 'OLD-V1', _is_scm: true }],
  offers: [{ 'Offer ID': 'MASTER-OFFER' }, { 'Offer ID': 'OLD-OFFER', _is_scm: true }]
};
const stats = adapter.mergeInto(target, rawRows);
assert.equal(stats.rawRowCount, 3);
assert.equal(target.items.filter(x => x._is_scm).length, 1, 'stale SCM items must be replaced');
assert.equal(target.subItems.filter(x => x._is_scm).length, 2, 'SCM sub items must be deduplicated');
assert.equal(target.offers.filter(x => x._is_scm).length, 2, 'SCM offers must be deduplicated');
assert.equal(target.items.find(x => x['Item Code'] === 'MASTER1')['Sub Item Count'], 1);

const galaxyDataPath = path.join(root, '..', 'GALAXY-SCM', 'galaxy_scm_raw_data.json');
if (fs.existsSync(galaxyDataPath)) {
  const galaxyData = JSON.parse(fs.readFileSync(galaxyDataPath, 'utf8'));
  const galaxyRows = galaxyData.rows.map(function (row) {
    return {
      rid: row.rid,
      item_no: row.itemNo,
      vendor_code: row.vendorCode,
      loc_code: row.locCode,
      sub_desc: row.subDesc,
      brand: row.brand,
      purch_unit: row.purchUnit,
      conversion: row.conversion,
      base_unit: row.baseUnit,
      hsd: row.hsd,
      storage: row.storage,
      moq: row.moq,
      mov: row.mov,
      ship_if: row.shipIf,
      items: { description: row.desc, category: row.category },
      vendor: { name: row.vendorName },
      locations: { region: row.region }
    };
  });
  const galaxyMapped = adapter.mapRows(galaxyRows);
  const accountedRids = galaxyMapped.subItems.reduce(function (sum, subItem) {
    return sum + subItem._scmRids.length;
  }, 0);
  const vendorAssignedRows = galaxyRows.filter(row => String(row.vendor_code || '').trim()).length;

  assert.equal(galaxyRows.length, 2711, 'GALAXY fixture row count changed unexpectedly');
  assert.equal(galaxyMapped.items.length, 247, 'all GALAXY items must map into Item Management');
  assert.equal(accountedRids, vendorAssignedRows, 'every vendor-assigned GALAXY row must be represented exactly once');
  assert.equal(galaxyMapped.unassignedVendorRowCount, 6, 'rows without a vendor must remain visible as validation debt');
  assert.equal(new Set(galaxyMapped.subItems.map(x => x['Sub Item Code'])).size, galaxyMapped.subItems.length, 'GALAXY sub item codes must be unique');
  assert.equal(new Set(galaxyMapped.offers.map(x => x['Offer ID'])).size, galaxyMapped.offers.length, 'GALAXY offer IDs must be unique');

  console.log('GALAXY fixture:', galaxyRows.length, 'rows ->', galaxyMapped.items.length, 'items,', galaxyMapped.subItems.length, 'sub items,', galaxyMapped.offers.length, 'offers,', galaxyMapped.unassignedVendorRowCount, 'rows need vendor assignment.');
}

console.log('Phase 1 smoke checks passed.');
