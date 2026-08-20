'use strict';

const fs = require('fs');
const path = require('path');
const { buildCanonical } = require('./canonical-model.cjs');

const root = path.resolve(__dirname, '..');
const galaxy = JSON.parse(fs.readFileSync(path.join(root, '..', 'GALAXY-SCM', 'galaxy_scm_raw_data.json'), 'utf8'));
const vendors = JSON.parse(fs.readFileSync(path.join(root, 'vendors_data.json'), 'utf8'));
const existing = JSON.parse(fs.readFileSync(path.join(root, 'public/data/fnb-catalog.json'), 'utf8'));
const vendorByCode = new Map(vendors.map(vendor => [vendor.code, vendor.name]));
const knownVendorCodes = new Set(vendors.map(vendor => vendor.code));
const canonical = buildCanonical(galaxy.rows, { knownVendorCodes });

const sourceByItem = new Map();
galaxy.rows.forEach(row => {
  if (!sourceByItem.has(row.itemNo)) sourceByItem.set(row.itemNo, row);
});
const subByCode = new Map(canonical.subItems.map(sub => [sub.subItemCode, sub]));
const locationsByOffer = new Map();
canonical.offerLocations.forEach(location => {
  if (!locationsByOffer.has(location.offerId)) locationsByOffer.set(location.offerId, []);
  locationsByOffer.get(location.offerId).push(location.locationCode);
});

existing.source = 'Bundled canonical fallback — GALAXY_SCM_CANONICAL_V1';
existing.items = canonical.items.map(item => {
  const row = sourceByItem.get(item.legacyItemNo) || {};
  const firstSub = canonical.subItems.find(sub => sub.itemCode === item.itemCode) || {};
  return {
    'Item Code': item.itemCode,
    'Item Name / Functional Spec': item.itemName,
    'Category Code': row.category || 'F&B',
    Domain: 'F&B',
    Allocation: 'FIFO',
    'Functional UOM': firstSub.baseUom || row.baseUnit || 'cai',
    'Legacy Item No': item.legacyItemNo,
    'Review Status': 'Approved',
    Status: 'Active'
  };
});
existing.subItems = canonical.subItems.map(sub => ({
  'Item Code': sub.itemCode,
  'Sub Item Code': sub.subItemCode,
  'Sub Item Name': sub.subItemName,
  Brand: sub.brand || '',
  Manufacturer: sub.brand || '',
  'Purchase UOM': sub.purchaseUom,
  Conversion: sub.conversionFactor,
  'Base UOM': sub.baseUom,
  'Shelf Life Days': sub.shelfLifeDays,
  Storage: sub.storageCondition,
  'Image Status': 'Missing',
  Status: 'Active',
  'Review Status': 'Approved',
  Images: [],
  'Image Records': []
}));
existing.offers = canonical.offers.map(offer => {
  const sub = subByCode.get(offer.subItemCode) || {};
  const locations = (locationsByOffer.get(offer.offerId) || []).sort();
  return {
    'Offer ID': offer.offerId,
    'Sub Item Code': offer.subItemCode,
    'Vendor Code': offer.vendorCode,
    'Vendor Name': vendorByCode.get(offer.vendorCode) || offer.vendorCode,
    'Location Code': locations.join(', '),
    Locations: locations,
    'Purchase UOM': sub.purchaseUom,
    Conversion: sub.conversionFactor,
    'Base UOM': sub.baseUom,
    'Offer Status': 'Active'
  };
});
existing.content = canonical.subItems.map(sub => ({
  'Sub Item Code': sub.subItemCode,
  'Display Name': sub.subItemName,
  Brand: sub.brand || '',
  Manufacturer: sub.brand || '',
  'Pack Description': [sub.purchaseUom, sub.conversionFactor, sub.baseUom].filter(value => value !== null && value !== undefined && value !== '').join(' · '),
  Images: []
}));

const itemCounts = new Map();
existing.subItems.forEach(sub => itemCounts.set(sub['Item Code'], (itemCounts.get(sub['Item Code']) || 0) + 1));
existing.items.forEach(item => { item['Sub Item Count'] = itemCounts.get(item['Item Code']) || 0; });

fs.writeFileSync(path.join(root, 'public/data/fnb-catalog.json'), JSON.stringify(existing, null, 2) + '\n');
console.log(`Fallback catalog: ${existing.items.length} items, ${existing.subItems.length} sub items, ${existing.offers.length} offers.`);
