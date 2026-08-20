(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ScmAdapter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function valueOf(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function related(row, key) {
    var value = row && row[key];
    return Array.isArray(value) ? (value[0] || {}) : (value || {});
  }

  function variantKey(row) {
    return JSON.stringify([
      valueOf(row.item_no),
      valueOf(row.vendor_code),
      valueOf(row.sub_desc),
      valueOf(row.brand),
      valueOf(row.purch_unit),
      valueOf(row.conversion),
      valueOf(row.base_unit),
      valueOf(row.hsd),
      valueOf(row.storage)
    ]);
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean))).sort();
  }

  function mapRows(rawRows) {
    var itemRows = (rawRows || []).filter(function (row) {
      return valueOf(row.item_no);
    });
    var rows = itemRows.filter(function (row) {
      return valueOf(row.vendor_code);
    });
    var groups = new Map();

    rows.forEach(function (row) {
      var key = variantKey(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    var grouped = Array.from(groups.entries()).map(function (entry) {
      return { key: entry[0], rows: entry[1] };
    }).sort(function (a, b) { return a.key.localeCompare(b.key); });

    var totals = {};
    grouped.forEach(function (group) {
      var row = group.rows[0];
      var base = valueOf(row.item_no) + '|' + valueOf(row.vendor_code);
      totals[base] = (totals[base] || 0) + 1;
    });

    var indexes = {};
    var itemsByCode = new Map();
    var subItems = [];
    var offers = [];

    itemRows.forEach(function (row) {
      var itemNo = valueOf(row.item_no);
      var item = related(row, 'items');
      if (!itemsByCode.has(itemNo)) {
        itemsByCode.set(itemNo, {
          'Item Code': itemNo,
          'Item Name / Functional Spec': valueOf(item.description) || itemNo,
          'Category Code': valueOf(item.category) || 'Cinemunch',
          'Domain': 'F&B',
          'Allocation': 'FIFO',
          'Functional UOM': valueOf(row.base_unit) || 'cái',
          '_is_scm': true
        });
      }
    });

    grouped.forEach(function (group) {
      var row = group.rows[0];
      var itemNo = valueOf(row.item_no);
      var vendorCode = valueOf(row.vendor_code);
      var base = itemNo + '|' + vendorCode;
      indexes[base] = (indexes[base] || 0) + 1;
      var suffix = totals[base] > 1 ? '-' + String(indexes[base]).padStart(3, '0') : '';
      var subItemCode = itemNo + '-' + vendorCode + suffix;
      var item = related(row, 'items');
      var vendor = related(row, 'vendor');
      var locations = unique(group.rows.map(function (x) { return valueOf(x.loc_code); }));
      var regions = unique(group.rows.map(function (x) {
        var location = related(x, 'locations');
        return valueOf(location.region || x.region);
      }));
      var rids = unique(group.rows.map(function (x) { return valueOf(x.rid); }));

      subItems.push({
        'Item Code': itemNo,
        'Sub Item Code': subItemCode,
        'Sub Item Name': valueOf(row.sub_desc) || valueOf(item.description) || itemNo,
        'Brand': valueOf(row.brand),
        'Purchase UOM': valueOf(row.purch_unit),
        'Conversion': row.conversion,
        'Base UOM': valueOf(row.base_unit),
        'Shelf Life Days': row.hsd,
        'Storage': valueOf(row.storage),
        'Image Status': group.rows.some(function (x) { return !!x.image_url; }) ? 'Available' : 'Missing',
        'Status': 'Active',
        'Vendor Name': valueOf(vendor.name) || vendorCode,
        '_is_scm': true,
        '_scmRids': rids,
        '_scmItemNo': itemNo,
        '_scmVendorCode': vendorCode
      });

      offers.push({
        'Offer ID': 'OFFER-SCM-' + vendorCode + '-' + itemNo + suffix,
        'Sub Item Code': subItemCode,
        'Vendor Code': vendorCode,
        'Vendor Name': valueOf(vendor.name) || vendorCode,
        'Region': regions.join(', '),
        'Location Code': locations.join(', '),
        'Locations': locations,
        'Purchase UOM': valueOf(row.purch_unit),
        'Conversion': row.conversion,
        'Base UOM': valueOf(row.base_unit),
        'MOQ': row.moq,
        'MOV': row.mov,
        'Ship If': valueOf(row.ship_if),
        '_is_scm': true,
        '_scmRids': rids
      });
    });

    return {
      items: Array.from(itemsByCode.values()),
      subItems: subItems,
      offers: offers,
      unassignedVendorRowCount: itemRows.length - rows.length
    };
  }

  function mergeInto(target, rawRows) {
    if (!target) throw new Error('Item Management data is not initialized');
    target.items = (target.items || []).filter(function (item) { return !item._is_scm; });
    target.subItems = (target.subItems || []).filter(function (item) { return !item._is_scm; });
    target.offers = (target.offers || []).filter(function (offer) { return !offer._is_scm; });

    var mapped = mapRows(rawRows);
    var existingItemCodes = new Set(target.items.map(function (item) { return item['Item Code']; }));
    target.items = target.items.concat(mapped.items.filter(function (item) {
      return !existingItemCodes.has(item['Item Code']);
    }));
    target.subItems = target.subItems.concat(mapped.subItems);
    target.offers = target.offers.concat(mapped.offers);

    var counts = {};
    target.subItems.forEach(function (item) {
      var code = item['Item Code'];
      counts[code] = (counts[code] || 0) + 1;
    });
    target.items.forEach(function (item) {
      item['Sub Item Count'] = counts[item['Item Code']] || 0;
    });

    return {
      rawRowCount: (rawRows || []).length,
      itemCount: mapped.items.length,
      subItemCount: mapped.subItems.length,
      offerCount: mapped.offers.length,
      unassignedVendorRowCount: mapped.unassignedVendorRowCount
    };
  }

  return { mapRows: mapRows, mergeInto: mergeInto, variantKey: variantKey };
});
