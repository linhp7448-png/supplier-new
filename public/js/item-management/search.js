(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ItemSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function text(value) { return value == null ? '' : String(value); }
  function normalized(value) { return text(value).normalize('NFC').trim().toLowerCase(); }

  function build(data) {
    data = data || {};
    var subsByItem = {}, offersBySub = {}, contentBySub = {}, replacementsByOld = {};
    (data.subItems || []).forEach(function (sub) {
      var code = sub['Item Code'];
      if (!subsByItem[code]) subsByItem[code] = [];
      subsByItem[code].push(sub);
    });
    (data.offers || []).forEach(function (offer) {
      var code = offer['Sub Item Code'];
      if (!offersBySub[code]) offersBySub[code] = [];
      offersBySub[code].push(offer);
    });
    (data.content || []).forEach(function (content) { contentBySub[content['Sub Item Code']] = content; });
    (data.replacements || []).forEach(function (replacement) { replacementsByOld[replacement.old_sub_item_code] = replacement; });
    return (data.items || []).map(function (item) {
      var subItems = (subsByItem[item['Item Code']] || []).map(function (sub) {
        return {
          subItem: sub,
          offers: offersBySub[sub['Sub Item Code']] || [],
          content: contentBySub[sub['Sub Item Code']] || {},
          replacement: replacementsByOld[sub['Sub Item Code']] || null
        };
      });
      return { item: item, subItems: subItems };
    });
  }

  function search(data, query, limit) {
    var q = normalized(query), words = q.split(/\s+/).filter(Boolean);
    if (!q) return [];
    return build(data).map(function (entry) {
      var haystack = [
        entry.item['Item Code'], entry.item['Item Name / Functional Spec'],
        entry.item['Legacy Item No'], entry.item['Category Code']
      ];
      entry.subItems.forEach(function (row) {
        haystack.push(row.subItem['Sub Item Code'], row.subItem['Sub Item Name'], row.subItem.Brand, row.subItem.Manufacturer);
        row.offers.forEach(function (offer) { haystack.push(offer['Vendor Code'], offer['Vendor Name'], offer['Location Code']); });
      });
      var normalizedHaystack = normalized(haystack.join(' '));
      var score = words.reduce(function (sum, word) { return sum + (normalizedHaystack.includes(word) ? 1 : 0); }, 0);
      return { entry: entry, score: score };
    }).filter(function (result) { return result.score === words.length; })
      .sort(function (a, b) { return b.score - a.score || text(a.entry.item['Item Code']).localeCompare(text(b.entry.item['Item Code'])); })
      .slice(0, limit || 30)
      .map(function (result) { return result.entry; });
  }

  function subItem(data, code) {
    var result = null;
    build(data).some(function (entry) {
      var found = entry.subItems.find(function (row) { return row.subItem['Sub Item Code'] === code; });
      if (found) { result = { item: entry.item, row: found }; return true; }
      return false;
    });
    return result;
  }

  return { build: build, search: search, subItem: subItem };
});
