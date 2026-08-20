(function () {
  'use strict';
  var originalCreate = window.supabase.createClient;
  var now = '2026-08-20T08:00:00Z';
  var tables = {
    mdm_category: [{ category_code: 'FNB-DRINK', domain: 'F&B', l1: 'F&B', l2: 'Beverage', l3: 'Milk', default_allocation: 'FEFO', batch_required: true, status: 'Active' }],
    mdm_item: [{ item_code: 'ITM-00000001', domain: 'F&B', category_code: 'FNB-DRINK', item_name: 'Sữa tươi', functional_uom: 'ml', allocation_policy: 'FEFO', batch_required: true, split_allowed: true, exact_only: false, review_status: 'Approved', status: 'Active' }],
    mdm_sub_item: [{ sub_item_code: 'SUB-000000001', item_code: 'ITM-00000001', sub_item_name: 'Sữa tươi hộp 1L', brand: 'QA Milk', manufacturer: 'QA Milk', purchase_uom: 'hop', conversion_factor: 1000, base_uom: 'ml', image_status: 'Missing', status: 'Active', review_status: 'Approved' }],
    mdm_supplier_offer: [], mdm_product_content: [], mdm_supplier_offer_location: [], mdm_product_image: [], mdm_sub_item_replacement: [],
    mdm_item_request: [{ request_no: 'IMR-2026-000001', request_type: 'Create_Item', requested_name: 'Sữa tươi hộp 1L', requester: 'qa@example.local', current_owner: 'MDM Steward', status: 'Approved', result_item_code: 'ITM-00000001', result_sub_item_code: 'SUB-000000001', created_at: now }],
    mdm_downstream_crosswalk: [{ target_system: 'NAV2017', entity_type: 'Item', canonical_code: 'ITM-00000001', external_id: 'NAV-1001', status: 'Verified', note: 'QA fixture' }],
    mdm_downstream_field_mapping: [
      { target_system: 'NAV2017', entity_type: 'Item', canonical_field: 'item_code', external_field: 'No', required: true, transform_rule: 'identity', sync_order: 10, active: true },
      { target_system: 'VISTA', entity_type: 'Sub_Item', canonical_field: 'sub_item_code', external_field: 'HOSubItemCode', required: true, transform_rule: 'identity', sync_order: 10, active: true }
    ],
    mdm_downstream_outbox: [
      { event_id: '00000000-0000-4000-8000-000000000001', event_key: 'NAV2017:Item:ITM-00000001:IMR-2026-000001:Upsert', target_system: 'NAV2017', entity_type: 'Item', canonical_code: 'ITM-00000001', external_id: 'NAV-1001', operation: 'Upsert', status: 'Synced', attempt_count: 1, created_at: now },
      { event_id: '00000000-0000-4000-8000-000000000002', event_key: 'VISTA:Item:ITM-00000001:IMR-2026-000001:Upsert', target_system: 'VISTA', entity_type: 'Item', canonical_code: 'ITM-00000001', external_id: null, operation: 'Upsert', status: 'Blocked', attempt_count: 0, last_error: 'Verified crosswalk is required before dispatch', created_at: now },
      { event_id: '00000000-0000-4000-8000-000000000003', event_key: 'NAV2017:Sub_Item:SUB-000000001:IMR-2026-000001:Upsert', target_system: 'NAV2017', entity_type: 'Sub_Item', canonical_code: 'SUB-000000001', external_id: 'NAV-SUB-1', operation: 'Upsert', status: 'Pending', attempt_count: 0, created_at: now }
    ]
  };

  function query(rows) {
    var state = { rows: rows.slice(), filters: [], order: null, limit: null, range: null, single: false };
    var builder = {
      select: function () { return builder; },
      eq: function (field, value) { state.filters.push([field, value]); return builder; },
      order: function (field, options) { state.order = [field, !options || options.ascending !== false]; return builder; },
      limit: function (value) { state.limit = value; return builder; },
      range: function (from, to) { state.range = [from, to]; return builder; },
      maybeSingle: function () { state.single = true; return builder; },
      single: function () { state.single = true; return builder; },
      then: function (resolve, reject) {
        var output = state.rows.filter(function (row) { return state.filters.every(function (filter) { return row[filter[0]] === filter[1]; }); });
        if (state.order) output.sort(function (a, b) { var result = String(a[state.order[0]] || '').localeCompare(String(b[state.order[0]] || '')); return state.order[1] ? result : -result; });
        if (state.range) output = output.slice(state.range[0], state.range[1] + 1);
        if (state.limit !== null) output = output.slice(0, state.limit);
        return Promise.resolve({ data: state.single ? (output[0] || null) : output, error: null }).then(resolve, reject);
      }
    };
    return builder;
  }

  window.supabase.createClient = function () {
    var client = originalCreate();
    var originalFrom = client.from.bind(client);
    client.from = function (table) { return Object.prototype.hasOwnProperty.call(tables, table) ? query(tables[table]) : originalFrom(table); };
    return client;
  };
})();
