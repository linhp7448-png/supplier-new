'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const envExample = fs.readFileSync(path.join(root, 'public/env.example.js'), 'utf8');
const uat = fs.readFileSync(path.join(root, 'PHASE5_UAT.md'), 'utf8');

const envScript = html.indexOf('<script src="env.js"></script>');
const supabaseScript = html.indexOf('@supabase/supabase-js@2');
assert(envScript >= 0, 'index.html must load env.js');
assert(supabaseScript > envScript, 'env.js must load before the Supabase client');
assert(!/https:\/\/[a-z]+\.supabase\.co/i.test(html), 'index.html must not hard-code a Supabase project');
assert(envExample.includes('YOUR-PROJECT.supabase.co'));
assert(!/(SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE)\s*:/i.test(envExample), 'Frontend env example must never request a service-role key');

for (let migration = 1; migration <= 6; migration += 1) {
  const prefix = String(migration).padStart(4, '0') + '_';
  const found = fs.readdirSync(path.join(root, 'supabase/migrations')).some(name => name.startsWith(prefix) && name.endsWith('.sql'));
  assert(found, `Migration ${prefix} must exist before staging UAT`);
}

[
  'Create Item', 'Add Sub-item', 'Add Supplier Offer', 'Update Content/Image',
  'Replace Sub-item', 'Duplicate submission', 'Missing crosswalk', 'Retry Failed',
  'Direct master write', 'Claim/complete event', 'Go/no-go gate'
].forEach(token => assert(uat.includes(token), `UAT plan must cover ${token}`));

console.log('Phase 5 release preflight checks passed.');
