import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace imScmDraftView
old_view = """      d.forEach((x, idx) => {
          var bg = x._status === 'NEW' ? '#f0fff4' : (x._status === 'MODIFIED' ? '#fffff0' : '#fff');
          var st = x._status === 'NEW' ? '<span class="impill ok">MỚI</span>' : '<span class="impill warn">SỬA ĐỔI</span>';
          root += '<tr style="background:' + bg + '"><td><input type="checkbox" ' + (x._checked ? 'checked' : '') + ' onchange="imScmDraftToggle(' + idx + ')"></td>' +
                  '<td>' + esc(x.vendor_code) + '</td>' + 
                  '<td>' + esc(x.loc_code) + '</td>' + 
                  '<td class="imcode">' + esc(x.item_no) + '</td>' + 
                  '<td>' + esc(x.sub_desc) + '</td>' + 
                  '<td>' + esc(x.brand) + '</td>' + 
                  '<td>' + esc(x.purch_unit) + (x.conversion ? ' (' + x.conversion + ' ' + (x.base_unit||'') + ')' : '') + '</td>' + 
                  '<td>' + esc(x.moq) + '</td>' + 
                  '<td>' + st + (x._warning ? '<br><span style="color:#c0392b;font-size:11px;font-weight:bold">' + x._warning + '</span>' : '') + '</td></tr>';
      });"""

new_view = """      d.forEach((x, idx) => {
          var bg = x._status === 'NEW' ? '#f0fff4' : (x._status === 'MODIFIED' ? '#fffff0' : '#fff');
          var st = x._status === 'NEW' ? '<span class="impill ok">MỚI</span>' : '<span class="impill warn">SỬA ĐỔI</span>';
          
          const hl = (field) => {
              if (x._diffs && x._diffs[field]) return `style="background:#fef08a;color:#92400e;font-weight:bold;cursor:help" title="${esc(x._diffs[field])}"`;
              return '';
          };
          const hlUom = () => {
              if (x._diffs && (x._diffs['UOM'] || x._diffs['Conv'] || x._diffs['Base'])) {
                  let tooltip = [];
                  if (x._diffs['UOM']) tooltip.push('UOM ' + x._diffs['UOM']);
                  if (x._diffs['Conv']) tooltip.push('Conv ' + x._diffs['Conv']);
                  if (x._diffs['Base']) tooltip.push('Base ' + x._diffs['Base']);
                  return `style="background:#fef08a;color:#92400e;font-weight:bold;cursor:help" title="${esc(tooltip.join(' | '))}"`;
              }
              return '';
          };

          root += '<tr style="background:' + bg + '"><td><input type="checkbox" ' + (x._checked ? 'checked' : '') + ' onchange="imScmDraftToggle(' + idx + ')"></td>' +
                  '<td>' + esc(x.vendor_code) + '</td>' + 
                  '<td>' + esc(x.loc_code) + '</td>' + 
                  '<td class="imcode">' + esc(x.item_no) + '</td>' + 
                  '<td ' + hl('Specs') + '>' + esc(x.sub_desc) + '</td>' + 
                  '<td ' + hl('Brand') + '>' + esc(x.brand) + '</td>' + 
                  '<td ' + hlUom() + '>' + esc(x.purch_unit) + (x.conversion ? ' (' + x.conversion + ' ' + (x.base_unit||'') + ')' : '') + '</td>' + 
                  '<td ' + hl('MOQ') + '>' + esc(x.moq) + '</td>' + 
                  '<td>' + st + (x._warning ? '<br><span style="color:#c0392b;font-size:11px;font-weight:bold">' + x._warning + '</span>' : '') + '</td></tr>';
      });"""

# Use regex for robust replacement
pattern = re.compile(r'd\.forEach\(\(x, idx\) => \{[\s\S]*?<td>\' \+ st \+ \(x\._warning \? \'<br><span style="color:#c0392b;font-size:11px;font-weight:bold">\' \+ x\._warning \+ \'</span>\' : \'\'\) \+ \'</td></tr>\';\s*\}\);')

if pattern.search(html):
    html = pattern.sub(new_view, html)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("SUCCESS")
else:
    print("FAILED TO MATCH")
