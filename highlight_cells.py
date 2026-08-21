import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update imMultiAddCommit to include _diffs
old_diff = """                        for (let i=0; i<oldStr.length; i++) {
                            if (oldStr[i] !== newStr[i]) {
                                diffs.push(fields[i] + ' {' + oldStr[i] + '} => {' + newStr[i] + '}');
                            }
                        }
                        warning = '⚠ Khác: ' + diffs.join('; ');
                    } else {"""
new_diff = """                        let _diffsMap = {};
                        for (let i=0; i<oldStr.length; i++) {
                            if (oldStr[i] !== newStr[i]) {
                                diffs.push(fields[i] + ' {' + oldStr[i] + '} => {' + newStr[i] + '}');
                                _diffsMap[fields[i]] = 'Cũ: ' + (oldStr[i] || '(trống)');
                            }
                        }
                        warning = '⚠ Khác: ' + diffs.join('; ');
                        r._diffs = _diffsMap;
                    } else {"""

html = html.replace(old_diff.replace('⚠', '⚠️'), new_diff.replace('⚠', '⚠️'))

# 2. Update imScmDraftCommit to delete _diffs
old_del = """                delete c._status;
                delete c._warning;
                delete c._checked;"""
new_del = """                delete c._status;
                delete c._warning;
                delete c._checked;
                delete c._diffs;"""
html = html.replace(old_del, new_del)

# 3. Update imScmDraftView
old_view = """      d.forEach((x, idx) => {
          var bg = x._status === 'NEW' ? '#f0fff4' : (x._status === 'MODIFIED' ? '#fffff0' : '#fff');
          var st = x._status === 'NEW' ? '<span class="impill ok">MỚI</span>' : '<span class="impill warn">SỬA ỔI</span>';
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

html = html.replace(old_view.replace('', 'Đ'), new_view)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated draft view highlights")
