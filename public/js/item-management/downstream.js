(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DownstreamSync = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TARGETS = ['NAV2017', 'VISTA'];
  var ENTITIES = ['Item', 'Sub_Item'];
  var STATUSES = ['Pending', 'Processing', 'Synced', 'Failed', 'Blocked'];

  function target(value) {
    var normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'NAV' || normalized === 'NAVISION') normalized = 'NAV2017';
    return TARGETS.indexOf(normalized) >= 0 ? normalized : '';
  }

  function key(row) {
    return [target(row && row.target_system), row && row.entity_type, row && row.canonical_code]
      .map(function (value) { return String(value || '').trim(); })
      .join('|');
  }

  function summarize(events) {
    var result = {
      total: 0, Pending: 0, Processing: 0, Synced: 0, Failed: 0, Blocked: 0,
      needsAttention: 0, waiting: 0, byTarget: { NAV2017: 0, VISTA: 0 }
    };
    (events || []).forEach(function (event) {
      var status = STATUSES.indexOf(event.status) >= 0 ? event.status : 'Blocked';
      result.total += 1;
      result[status] += 1;
      if (status === 'Failed' || status === 'Blocked') result.needsAttention += 1;
      if (status === 'Pending' || status === 'Processing') result.waiting += 1;
      var system = target(event.target_system);
      if (system) result.byTarget[system] += 1;
    });
    return result;
  }

  function validateCrosswalk(rows) {
    var seenCanonical = {}, seenExternal = {}, issues = [];
    (rows || []).filter(function (row) { return row.status !== 'Inactive'; }).forEach(function (row) {
      var system = target(row.target_system);
      var entity = String(row.entity_type || '').trim();
      var canonical = String(row.canonical_code || '').trim();
      var external = String(row.external_id || '').trim();
      var canonicalKey = [system, entity, canonical].join('|');
      var externalKey = [system, entity, external].join('|');
      if (!system) issues.push({ code: 'INVALID_TARGET', row: row });
      if (ENTITIES.indexOf(entity) < 0) issues.push({ code: 'INVALID_ENTITY', row: row });
      if (!canonical || !external) issues.push({ code: 'MISSING_CODE', row: row });
      if (seenCanonical[canonicalKey]) issues.push({ code: 'DUPLICATE_CANONICAL', row: row });
      if (external && seenExternal[externalKey]) issues.push({ code: 'DUPLICATE_EXTERNAL', row: row });
      seenCanonical[canonicalKey] = true;
      if (external) seenExternal[externalKey] = true;
    });
    return { ok: issues.length === 0, issues: issues };
  }

  function mappingGroups(mappings) {
    return (mappings || []).filter(function (row) { return row.active !== false; }).reduce(function (groups, row) {
      var groupKey = target(row.target_system) + '|' + String(row.entity_type || '');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
      groups[groupKey].sort(function (a, b) { return Number(a.sync_order || 0) - Number(b.sync_order || 0); });
      return groups;
    }, {});
  }

  // Adapter boundary only: it builds a deterministic request but never sends it.
  function dispatchRequest(event, endpoint) {
    var system = target(event && event.target_system);
    var url = String(endpoint || '').trim();
    if (!system) throw new Error('Unsupported downstream target');
    if (!/^https:\/\//i.test(url)) throw new Error('A HTTPS adapter endpoint is required');
    if (!event || !event.event_key || !event.payload) throw new Error('A complete outbox event is required');
    return {
      method: 'POST',
      url: url.replace(/\/$/, '') + '/v1/master-data/' + system.toLowerCase(),
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': event.event_key,
        'X-GERP-Schema-Version': String(event.payload.schema_version || '1.0')
      },
      body: JSON.stringify({
        event_id: event.event_id,
        event_key: event.event_key,
        operation: event.operation,
        entity_type: event.entity_type,
        canonical_code: event.canonical_code,
        external_id: event.external_id,
        payload: event.payload
      })
    };
  }

  return {
    TARGETS: TARGETS,
    ENTITIES: ENTITIES,
    STATUSES: STATUSES,
    target: target,
    key: key,
    summarize: summarize,
    validateCrosswalk: validateCrosswalk,
    mappingGroups: mappingGroups,
    dispatchRequest: dispatchRequest
  };
});
