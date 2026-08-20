'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Loader = require('../public/js/item-management/loader.js');

(async function () {
  assert.strictEqual(Loader.isRetryable(new Error('Failed to fetch')), true);
  assert.strictEqual(Loader.isRetryable({ message: 'relation mdm_item does not exist' }), false);
  assert.strictEqual(Loader.projectRef('https://abc123.supabase.co'), 'abc123');

  let attempts = 0;
  const recovered = await Loader.queryWithRetry(async function () {
    attempts += 1;
    if (attempts === 1) throw new Error('Failed to fetch');
    return { data: [{ ok: true }], error: null };
  }, { attempts: 2, delayMs: 0 });
  assert.strictEqual(attempts, 2);
  assert.strictEqual(recovered.data.length, 1);

  attempts = 0;
  const missingTable = await Loader.queryWithRetry(async function () {
    attempts += 1;
    return { data: null, error: { message: 'relation mdm_item does not exist' } };
  }, { attempts: 2, delayMs: 0 });
  assert.strictEqual(attempts, 1, 'A schema error must not be retried');
  assert(missingTable.error);

  const catalogFixture = { items: [{}], subItems: [{}], offers: [] };
  const loaded = await Loader.loadCatalog(async function () {
    return { ok: true, json: async function () { return catalogFixture; } };
  }, '/data/catalog.json');
  assert.strictEqual(loaded, catalogFixture);
  await assert.rejects(() => Loader.loadCatalog(async function () {
    return { ok: false, status: 404, json: async function () { return {}; } };
  }, '/missing.json'), /HTTP 404/);
  assert.throws(() => Loader.validateCatalog({ items: [], subItems: [], offers: [] }), /empty/i);

  const root = path.resolve(__dirname, '..');
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public/data/fnb-catalog.json'), 'utf8'));
  assert.strictEqual(catalog.items.length, 247, 'fallback must contain reconciled Item data');
  assert.strictEqual(catalog.subItems.length, 294, 'fallback must contain vendor-independent Sub-items');
  assert.strictEqual(catalog.offers.length, 505, 'fallback must contain Supplier Offers');

  const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert(html.includes('js/item-management/loader.js'));
  assert(html.includes('queryWithRetry'));
  assert(html.includes('Local product catalog · read-only'));
  assert(html.includes('onclick="imRetryLoad()"'));
  assert(!/await loadScmIntoIMD\(\)/.test(html), 'fallback must not depend on the SCM database');

  console.log('Product loader hotfix checks passed.');
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
