import re
with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove the previously injected imSaveInline
html = re.sub(r'window\.imSaveInline = async function.*?};\s*', '', html, flags=re.DOTALL)

# 2. Add the Modal HTML and JS functions
modal_code = '''
    function imEditSelected() {
        var toEdit = Object.keys(window.imSelected).filter(k => window.imSelected[k]);
        if (toEdit.length !== 1) return;
        
        var sid = toEdit[0];
        var allRows = window._imRowsCache || window._currentImRows || [];
        var row = allRows.find(r => r['Sub Item Code'] === sid);
        if (!row) {
            // Find in IMD directly
            var sub = (IMD.subItems || []).find(x => x['Sub Item Code'] === sid);
            if (sub) {
                var it = (IMD.items || []).find(i => i['Item Code'] === sub['Item Code']) || {};
                var of = (IMD.offers || []).find(o => o['Sub Item Code'] === sid) || {};
                row = {
                    'Item Code': sub['Item Code'], 'Item Name': it['Item Name / Functional Spec'] || '',
                    'Sub Item Code': sub['Sub Item Code'], 'Sub Item Name': sub['Sub Item Name'] || '',
                    'Brand': sub['Brand'] || '', 'Purchase UOM': sub['Purchase UOM'] || '',
                    'Conversion': sub['Conversion'] || '', 'Base UOM': sub['Base UOM'] || '',
                    'Shelf Life': sub['Shelf Life Days'] || '', 'Storage': sub['Storage'] || '',
                    'Vendor Code': of['Vendor Code'] || '', 'Purchase Price': of['Unit Price Excl VAT'] || ''
                };
            }
        }
        
        if (!row) { alert("Không tìm thấy dữ liệu."); return; }
        
        var form = `
        <div id="imEditModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999">
            <div style="background:#fff;padding:24px;border-radius:12px;width:500px;max-width:90%;box-shadow:0 10px 25px rgba(0,0,0,0.2)">
                <h2 style="margin:0 0 16px 0;font-size:20px;color:#2c3e50">✏️ Chỉnh sửa sản phẩm</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-height:60vh;overflow-y:auto;padding-right:10px">
                    <div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Item Name (Core)</label><input id="editItemName" value="${esc(row['Item Name'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Sub Item Name (Physical)</label><input id="editSubName" value="${esc(row['Sub Item Name'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Brand</label><input id="editBrand" value="${esc(row['Brand'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Shelf Life (Days)</label><input id="editShelfLife" type="number" value="${esc(row['Shelf Life'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Purchase UOM</label><input id="editPurchUOM" value="${esc(row['Purchase UOM'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Conversion</label><input id="editConv" type="number" step="0.01" value="${esc(row['Conversion'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Base UOM</label><input id="editBaseUOM" value="${esc(row['Base UOM'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#7f8c8d;margin-bottom:4px">Storage</label><input id="editStorage" value="${esc(row['Storage'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end;gap:10px">
                    <button class="tbtn" style="background:#f1f2f6;color:#2c3e50;padding:8px 16px;border-radius:6px;border:none;cursor:pointer" onclick="document.getElementById('imEditModal').remove()">Hủy</button>
                    <button class="tbtn" style="background:#2980b9;color:#fff;padding:8px 16px;border-radius:6px;border:none;font-weight:bold;cursor:pointer" onclick="imSaveModal('${sid}')">Lưu Thay Đổi</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', form);
    }
    
    async function imSaveModal(sid) {
        var btn = document.querySelector('#imEditModal button:last-child');
        btn.innerText = 'Đang lưu...';
        btn.disabled = true;
        
        try {
            var itemNo = sid.split('-')[0];
            var vendorCode = sid.split('-')[1];
            
            // Update items table
            const { error: e1 } = await sb.from('items').update({
                description: document.getElementById('editItemName').value
            }).eq('item_no', itemNo);
            if (e1) throw e1;
            
            // Update raw_data table
            const { error: e2 } = await sb.from('raw_data').update({
                sub_desc: document.getElementById('editSubName').value,
                brand: document.getElementById('editBrand').value,
                purch_unit: document.getElementById('editPurchUOM').value,
                conversion: document.getElementById('editConv').value || null,
                base_unit: document.getElementById('editBaseUOM').value,
                hsd: document.getElementById('editShelfLife').value || null,
                storage: document.getElementById('editStorage').value
            }).eq('item_no', itemNo).eq('vendor_code', vendorCode);
            if (e2) throw e2;
            
            document.getElementById('imEditModal').remove();
            
            // Reload data
            if (window.loadScmIntoIMD) {
                var content = document.getElementById('content');
                var old = content.innerHTML;
                content.innerHTML = '<div class="imempty">Đang tải lại dữ liệu...</div>';
                await loadScmIntoIMD();
                imRender();
            }
            
        } catch (e) {
            console.error(e);
            alert('Lỗi khi lưu: ' + e.message);
            btn.innerText = 'Lưu Thay Đổi';
            btn.disabled = false;
        }
    }
'''

if 'function imEditSelected()' not in html:
    html = html.replace('function imList() {', modal_code + '\n    function imList() {')

# 3. Add Edit button to toolbar
# Find var delBtn = ...
del_btn_pattern = r"var delBtn = selCount > 0 \? '<button class=\"tbtn\" style=\"background:#fdecec;color:#c0392b;border:1px solid #c0392b;margin-right:10px\" onclick=\"imDeleteSelected\(\)\">🗑 Xóa ' \+ selCount \+ ' mục</button>' : '';"
replacement = "var delBtn = selCount > 0 ? '<button class=\"tbtn\" style=\"background:#fdecec;color:#c0392b;border:1px solid #c0392b;margin-right:10px\" onclick=\"imDeleteSelected()\">🗑 Xóa ' + selCount + ' mục</button>' : '';\n        var editBtn = selCount === 1 ? '<button class=\"tbtn\" style=\"background:#eaf1fb;color:#2b6cb0;border:1px solid #2b6cb0;margin-right:10px\" onclick=\"imEditSelected()\">✏️ Sửa sản phẩm</button>' : '';\n        delBtn = editBtn + delBtn;"
html = re.sub(del_btn_pattern, replacement, html)

# 4. Revert inline edit in td logic
def revert_td(match):
    return '''
          if (c === 'Sub Item Code' || c === 'Item Code') return '<td class="imcode">' + esc(v) + '</td>';
          if (c === 'Status') return '<td>' + imStatus(v) + '</td>';
          if (c === 'Purchase UOM' || c === 'Base UOM' || c === 'Functional UOM') return '<td>' + (v ? imPill(v) : '—') + '</td>';
          if (c === 'Sub Item Name' || c === 'Item Name' || c === 'Item Name / Functional Spec') return '<td><b>' + esc(v || '—') + '</b></td>';
          if (c === 'Purchase Price') return '<td style="text-align:right">' + (v !== '' ? Number(v).toLocaleString('vi-VN') : '—') + '</td>';
          if (c === 'Valid To') { var vs = r['_valst']; var sty = vs === 'expired' ? 'background:#fdecec;color:#c0392b;font-weight:700' : vs === 'soon' ? 'background:#fdf4e3;color:#b8851f;font-weight:700' : ''; return '<td style="' + sty + '">' + esc(v === '' ? (r['Valid From'] ? 'nay' : '—') : v) + (vs === 'expired' ? ' ⚠' : vs === 'soon' ? ' ⏳' : '') + '</td>'; }
          return '<td>' + esc(v === '' ? '—' : v) + '</td>';
'''
pattern = r"          var editableFields = \['Sub Item Name'.*?return '<td' \+ editHtml \+ '>' \+ esc\(v === '' \? '—' : v\) \+ '</td>';"
html = re.sub(pattern, revert_td, html, flags=re.DOTALL)

# Let's save a global reference to rows for the edit function
html = html.replace('var rowsAll = _imGetData(t);', 'var rowsAll = _imGetData(t);\n      window._imRowsCache = rowsAll;')


with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
    
print('Updated index.html for Modal Edit')
