import re
with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
    
# Replace the old form string with the new one
new_form = '''
        var form = `
        <div id="imEditModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999">
            <div style="background:#fff;padding:24px;border-radius:12px;width:700px;max-width:90%;box-shadow:0 10px 25px rgba(0,0,0,0.2)">
                <h2 style="margin:0 0 16px 0;font-size:20px;color:#2c3e50">✏️ Chỉnh sửa chi tiết sản phẩm</h2>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;max-height:70vh;overflow-y:auto;padding-right:10px">
                    <div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#2b6cb0;margin-bottom:4px">Item Name (Core)</label><input id="editItemName" value="${esc(row['Item Name'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#2b6cb0;margin-bottom:4px">Category (Core)</label><input id="editCategory" value="${esc(row['Category Code'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    
                    <div style="grid-column:1/3"><label style="display:block;font-size:11px;font-weight:bold;color:#147a52;margin-bottom:4px">Sub Item Name (Physical)</label><input id="editSubName" value="${esc(row['Sub Item Name'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#147a52;margin-bottom:4px">Brand</label><input id="editBrand" value="${esc(row['Brand'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Purchase UOM</label><input id="editPurchUOM" value="${esc(row['Purchase UOM'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Conversion</label><input id="editConv" type="number" step="0.01" value="${esc(row['Conversion'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Base UOM</label><input id="editBaseUOM" value="${esc(row['Base UOM'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Shelf Life (Days)</label><input id="editShelfLife" type="number" value="${esc(row['Shelf Life'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Storage</label><input id="editStorage" value="${esc(row['Storage'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#68727f;margin-bottom:4px">Purchase Price</label><input id="editPrice" type="number" value="${esc(row['Purchase Price'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#b8851f;margin-bottom:4px">MOQ</label><input id="editMOQ" type="number" value="${esc(row['MOQ'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#b8851f;margin-bottom:4px">MOV</label><input id="editMOV" type="number" value="${esc(row['MOV'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                    <div><label style="display:block;font-size:11px;font-weight:bold;color:#b8851f;margin-bottom:4px">Ship if (Days)</label><input id="editShipIf" type="number" value="${esc(row['Ship If'])}" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px"></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end;gap:10px">
                    <button class="tbtn" style="background:#f1f2f6;color:#2c3e50;padding:8px 16px;border-radius:6px;border:none;cursor:pointer" onclick="document.getElementById('imEditModal').remove()">Hủy</button>
                    <button class="tbtn" style="background:#2980b9;color:#fff;padding:8px 16px;border-radius:6px;border:none;font-weight:bold;cursor:pointer" onclick="imSaveModal('${sid}')">Lưu Thay Đổi</button>
                </div>
            </div>
        </div>
        `;
'''

html = re.sub(r'var form = `.*?</div>\n        </div>\n        `;', new_form, html, flags=re.DOTALL)

# Update the imEditSelected to supply row properties properly
new_row_logic = '''row = {
                    'Category Code': it['Category Code'] || '', 'Item Code': sub['Item Code'], 'Item Name': it['Item Name / Functional Spec'] || '',
                    'Sub Item Code': sub['Sub Item Code'], 'Sub Item Name': sub['Sub Item Name'] || '',
                    'Brand': sub['Brand'] || '', 'Purchase UOM': sub['Purchase UOM'] || '',
                    'Conversion': sub['Conversion'] || '', 'Base UOM': sub['Base UOM'] || '',
                    'Shelf Life': sub['Shelf Life Days'] || '', 'Storage': sub['Storage'] || '',
                    'Vendor Code': of['Vendor Code'] || '', 'Purchase Price': of['Unit Price Excl VAT'] || '',
                    'MOQ': of['MOQ'] || '', 'MOV': of['MOV'] || '', 'Ship If': of['Ship If'] || ''
                };'''

html = re.sub(r'row = \{[^}]*?Purchase Price[^}]*\};', new_row_logic, html, flags=re.DOTALL)


# Update imSaveModal to include the new fields
new_save = '''// Update items table
            const { error: e1 } = await sb.from('items').update({
                description: document.getElementById('editItemName').value,
                category: document.getElementById('editCategory').value
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
                storage: document.getElementById('editStorage').value,
                unit_price_excl_vat: document.getElementById('editPrice').value || null,
                moq: document.getElementById('editMOQ').value || null,
                mov: document.getElementById('editMOV').value || null,
                ship_if: document.getElementById('editShipIf').value || null
            }).eq('item_no', itemNo).eq('vendor_code', vendorCode);'''

html = re.sub(r'// Update items table.*?\.eq\(\'item_no\', itemNo\)\.eq\(\'vendor_code\', vendorCode\);', new_save, html, flags=re.DOTALL)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated modal to include all fields')
