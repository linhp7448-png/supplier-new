import re
with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add imSaveInline function
save_inline_code = '''
    window.imSaveInline = async function(el, sid, colName) {
        var newVal = el.innerText.trim();
        var oVal = el.getAttribute('data-oval');
        if (newVal === oVal) return; // No change
        
        el.style.backgroundColor = '#fffbeb'; // Yellow indicating saving
        
        var fieldMap = {
            'Sub Item Name': { table: 'raw_data', col: 'sub_desc' },
            'Brand': { table: 'raw_data', col: 'brand' },
            'Purchase UOM': { table: 'raw_data', col: 'purch_unit' },
            'Conversion': { table: 'raw_data', col: 'conversion' },
            'Base UOM': { table: 'raw_data', col: 'base_unit' },
            'Shelf Life': { table: 'raw_data', col: 'hsd' },
            'Shelf Life Days': { table: 'raw_data', col: 'hsd' },
            'Storage': { table: 'raw_data', col: 'storage' },
            'MOQ': { table: 'raw_data', col: 'moq' },
            'Purchase Price': { table: 'raw_data', col: 'unit_price_excl_vat', isNum: true },
            'Item Name': { table: 'items', col: 'description' },
            'Item Name / Functional Spec': { table: 'items', col: 'description' }
        };
        
        var map = fieldMap[colName];
        if (!map) {
            alert('Cột này không hỗ trợ sửa trực tiếp.');
            el.innerText = oVal;
            el.style.backgroundColor = '';
            return;
        }
        
        try {
            var valToSave = map.isNum ? Number(newVal.replace(/[^0-9.-]+/g, '')) : newVal;
            if (map.table === 'raw_data') {
                var itemNo = sid.split('-')[0];
                var vendorCode = sid.split('-')[1];
                
                var updateData = {};
                updateData[map.col] = valToSave;
                
                const { error } = await sb.from('raw_data').update(updateData).eq('item_no', itemNo).eq('vendor_code', vendorCode);
                if (error) throw error;
            } else if (map.table === 'items') {
                var itemNo = sid.split('-')[0];
                var updateData = {};
                updateData[map.col] = valToSave;
                
                const { error } = await sb.from('items').update(updateData).eq('item_no', itemNo);
                if (error) throw error;
            }
            
            // Success
            el.style.backgroundColor = '#f0fff4'; // Green success
            el.setAttribute('data-oval', newVal);
            
            // Reload data in background
            setTimeout(function() {
                el.style.backgroundColor = '';
                if (window.loadScmIntoIMD) { loadScmIntoIMD(); } // Reload from DB to sync memory
            }, 1000);
            
        } catch (e) {
            console.error(e);
            alert('Lỗi khi lưu: ' + e.message);
            el.innerText = oVal;
            el.style.backgroundColor = '#fff1f0'; // Red error
        }
    };
'''

if 'window.imSaveInline =' not in html:
    html = html.replace('function imList() {', save_inline_code + '\n    function imList() {')

def replace_td(match):
    return '''
          var editableFields = ['Sub Item Name', 'Item Name', 'Item Name / Functional Spec', 'Brand', 'Purchase UOM', 'Conversion', 'Base UOM', 'Shelf Life', 'Shelf Life Days', 'Storage', 'Purchase Price'];
          var isEdit = editableFields.includes(c);
          var editHtml = isEdit ? ' contenteditable="true" data-oval="' + esc(v || '') + '" onblur="imSaveInline(this, \\'' + sid + '\\', \\'' + c + '\\')" onclick="event.stopPropagation()" style="outline:none;border-bottom:1px dashed #ccc"' : '';
          
          if (c === 'Sub Item Code' || c === 'Item Code') return '<td class="imcode">' + esc(v) + '</td>';
          if (c === 'Status') return '<td>' + imStatus(v) + '</td>';
          if (c === 'Purchase UOM' || c === 'Base UOM' || c === 'Functional UOM') return '<td' + editHtml + '>' + (v ? imPill(v) : '—') + '</td>';
          if (c === 'Sub Item Name' || c === 'Item Name' || c === 'Item Name / Functional Spec') return '<td' + editHtml + '><b>' + esc(v || '—') + '</b></td>';
          if (c === 'Purchase Price') return '<td' + editHtml + ' style="text-align:right">' + (v !== '' ? Number(v).toLocaleString('vi-VN') : '—') + '</td>';
          if (c === 'Valid To') { var vs = r['_valst']; var sty = vs === 'expired' ? 'background:#fdecec;color:#c0392b;font-weight:700' : vs === 'soon' ? 'background:#fdf4e3;color:#b8851f;font-weight:700' : ''; return '<td style="' + sty + '">' + esc(v === '' ? (r['Valid From'] ? 'nay' : '—') : v) + (vs === 'expired' ? ' ⚠' : vs === 'soon' ? ' ⏳' : '') + '</td>'; }
          return '<td' + editHtml + '>' + esc(v === '' ? '—' : v) + '</td>';
'''

pattern = r"          if \(c === 'Sub Item Code'.*?return '<td>' \+ esc\(v === '' \? '—' : v\) \+ '</td>';"
new_html = re.sub(pattern, replace_td, html, flags=re.DOTALL)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)
    
print('Updated index.html')
