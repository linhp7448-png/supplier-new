const crypto = require('node:crypto');

function clean(value) {
  return String(value == null ? '' : value).replace(/\u00a0/g, ' ').normalize('NFC').trim().toLowerCase();
}

function rawValue(row, camel, snake) {
  return row[camel] !== undefined ? row[camel] : row[snake];
}

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex').toUpperCase();
}

function physicalKey(row) {
  return [
    rawValue(row, 'itemNo', 'item_no'),
    rawValue(row, 'subDesc', 'sub_desc'),
    row.brand,
    rawValue(row, 'purchUnit', 'purch_unit'),
    row.conversion,
    rawValue(row, 'baseUnit', 'base_unit'),
    row.hsd,
    row.storage
  ].map(clean).join('\u001f');
}

function itemNo(row) { return clean(rawValue(row, 'itemNo', 'item_no')).toUpperCase(); }
function vendorCode(row) { return clean(rawValue(row, 'vendorCode', 'vendor_code')).toUpperCase(); }
function locationCode(row) { return clean(rawValue(row, 'locCode', 'loc_code')).toUpperCase(); }

function collectDistinct(rows, getter) {
  return Array.from(new Set(rows.map(getter).filter(Boolean))).sort();
}

function buildCanonical(rawRows, options = {}) {
  const rows = rawRows || [];
  const knownVendorCodes = options.knownVendorCodes
    ? new Set(Array.from(options.knownVendorCodes, clean).filter(Boolean))
    : null;
  const items = new Map();
  const subItems = new Map();
  const offers = new Map();
  const offerLocations = new Map();
  const lineage = [];
  const issues = [];

  rows.forEach((row) => {
    const code = itemNo(row);
    if (!code) {
      issues.push({ issueCode: 'MISSING_ITEM', sourceKey: String(row.rid || '') });
      return;
    }
    if (!items.has(code)) {
      items.set(code, {
        itemCode: code,
        itemName: String(rawValue(row, 'desc', 'description') || code).trim(),
        legacyItemNo: code
      });
    }

    const key = physicalKey(row);
    const subItemCode = code + '-' + md5(key).slice(0, 8);
    if (!subItems.has(key)) {
      subItems.set(key, {
        subItemCode,
        itemCode: code,
        physicalFingerprint: key,
        subItemName: String(rawValue(row, 'subDesc', 'sub_desc') || rawValue(row, 'desc', 'description') || code).trim(),
        brand: String(row.brand || '').trim(),
        purchaseUom: String(rawValue(row, 'purchUnit', 'purch_unit') || '').trim(),
        conversionFactor: row.conversion,
        baseUom: String(rawValue(row, 'baseUnit', 'base_unit') || '').trim(),
        shelfLifeDays: row.hsd,
        storageCondition: String(row.storage || '').trim()
      });
    }

    const vendor = vendorCode(row);
    let offerId = null;
    if (vendor) {
      offerId = 'OFFER-SCM-' + md5(subItemCode + '\u001f' + vendor).slice(0, 16);
      const offerKey = subItemCode + '\u001f' + vendor;
      if (!offers.has(offerKey)) {
        offers.set(offerKey, { offerId, subItemCode, vendorCode: vendor });
      }
      const location = locationCode(row);
      if (location) {
        const locationKey = offerId + '\u001f' + location;
        const existing = offerLocations.get(locationKey);
        if (existing) existing.sourceRowCount += 1;
        else offerLocations.set(locationKey, {
          offerId,
          locationCode: location,
          sourceRowCount: 1
        });
      }
      if (knownVendorCodes && !knownVendorCodes.has(clean(vendor))) {
        issues.push({ issueCode: 'UNMATCHED_VENDOR', sourceKey: vendor, rid: row.rid });
      }
    } else {
      issues.push({ issueCode: 'MISSING_VENDOR', sourceKey: String(row.rid || ''), itemCode: code });
    }

    lineage.push({
      rawRid: row.rid,
      itemCode: code,
      subItemCode,
      offerId,
      locationCode: locationCode(row),
      issueCode: vendor ? null : 'MISSING_VENDOR'
    });
  });

  for (const location of offerLocations.values()) {
    if (location.sourceRowCount > 1) {
      issues.push({
        issueCode: 'DUPLICATE_OFFER_LOCATION',
        sourceKey: location.offerId + '|' + location.locationCode,
        sourceRowCount: location.sourceRowCount
      });
    }
  }

  const itemRows = new Map();
  const vendorRows = new Map();
  rows.forEach((row) => {
    const item = itemNo(row);
    if (item) {
      if (!itemRows.has(item)) itemRows.set(item, []);
      itemRows.get(item).push(row);
    }
    const vendor = vendorCode(row);
    if (vendor) {
      if (!vendorRows.has(vendor)) vendorRows.set(vendor, []);
      vendorRows.get(vendor).push(row);
    }
  });
  for (const [code, groupedRows] of itemRows) {
    const descriptions = collectDistinct(groupedRows, row => clean(rawValue(row, 'desc', 'description')));
    if (descriptions.length > 1) {
      issues.push({ issueCode: 'INCONSISTENT_ITEM_DESCRIPTION', sourceKey: code, values: descriptions });
    }
  }
  for (const [code, groupedRows] of vendorRows) {
    const names = collectDistinct(groupedRows, row => clean(rawValue(row, 'vendorName', 'vendor_name')));
    if (names.length > 1) {
      issues.push({ issueCode: 'INCONSISTENT_VENDOR_NAME', sourceKey: code, values: names });
    }
  }

  return {
    items: Array.from(items.values()),
    subItems: Array.from(subItems.values()),
    offers: Array.from(offers.values()),
    offerLocations: Array.from(offerLocations.values()),
    lineage,
    issues
  };
}

module.exports = { buildCanonical, clean, physicalKey };
