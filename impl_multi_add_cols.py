import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Replace the table headers in imMultiAddView
old_thead = '<thead><tr style="background:#f8f9fa;text-align:left"><th style="padding:8px;border-bottom:2px solid #ccc">Vendor Code</th><th style="padding:8px;border-bottom:2px solid #ccc">Location</th><th style="padding:8px;border-bottom:2px solid #ccc">Item No</th><th style="padding:8px;border-bottom:2px solid #ccc">Tên hàng (Specs)</th><th style="padding:8px;border-bottom:2px solid #ccc">Brand</th><th style="padding:8px;border-bottom:2px solid #ccc">UOM (Quy cách)</th><th style="padding:8px;border-bottom:2px solid #ccc">MOQ</th></tr></thead>'
new_thead = '<thead><tr style="background:#f8f9fa;text-align:left;white-space:nowrap;font-size:12px">' + ''.join([f'<th style="padding:8px;border-bottom:2px solid #ccc">{h}</th>' for h in [
        'Region', 'Key', 'Location Code', 'Vendor name', 'Vendor Code', 'Category', 'Item No', 
        'Description', 'Sub Description', 'Brand', 'Purchase UOM', 'Conversion', 'Base Unit', 
        'MOQ / PO', 'MOV / PO', 'SHIP if <MOQ/MOV', 'HSD (Ngày)', 'Storage'
    ]]) + '</tr></thead>'
html = html.replace(old_thead, new_thead)

# 2. Replace the row template in imMultiAddView and imMultiAddMoreRows and imMultiAddPaste
old_tds = "'<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:200px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px\"></td>' +\n                '<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:80px\"></td>'"
new_tds = " + ".join(["'<td contenteditable=\"true\" style=\"padding:8px;border-bottom:1px solid #eee;outline:none;min-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px\"></td>'"] * 18)
html = html.replace(old_tds, new_tds)

# Also update the row creation in imMultiAddPaste
old_paste_tr = "'<tr><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td><td contenteditable=\"true\"></td></tr>'"
new_paste_tr = "'<tr>" + ("<td contenteditable=\"true\"></td>" * 18) + "</tr>'"
html = html.replace(old_paste_tr, new_paste_tr)

# 3. Replace the parsing logic in imMultiAddCommit
# We use regex to find the commit loop accurately
commit_pattern = re.compile(r'rows\.forEach\(tr => \{.*?rawDataArray\.push\(\{.*?\}\);\s*\}\s*\}\);', re.DOTALL)

new_commit_loop = """rows.forEach(tr => {
            var tds = tr.querySelectorAll('td');
            if (tds.length < 18) return;
            
            var locCode = tds[2].innerText.trim();
            var vendorCode = tds[4].innerText.trim();
            var itemNo = tds[6].innerText.trim();
            var subDesc = tds[8].innerText.trim();
            var brand = tds[9].innerText.trim();
            var uom = tds[10].innerText.trim();
            var conv = tds[11].innerText.trim();
            var base = tds[12].innerText.trim();
            var moqStr = tds[13].innerText.trim();
            var movStr = tds[14].innerText.trim();
            var shipIf = tds[15].innerText.trim();
            var hsdStr = tds[16].innerText.trim();
            var storage = tds[17].innerText.trim();
            
            if (vendorCode && locCode && itemNo) {
                rawDataArray.push({
                    vendor_code: vendorCode,
                    loc_code: locCode,
                    item_no: itemNo,
                    sub_desc: subDesc || null,
                    brand: brand || null,
                    purch_unit: uom || null,
                    conversion: sanitizeNum(conv),
                    base_unit: base || null,
                    moq: sanitizeNum(moqStr),
                    mov: sanitizeNum(movStr),
                    ship_if: shipIf || null,
                    hsd: sanitizeNum(hsdStr),
                    storage: storage || null,
                    image_url: (window.MULTI_ADD_IMAGES && window.MULTI_ADD_IMAGES.has(itemNo.toUpperCase())) ? window.MULTI_ADD_IMAGES.get(itemNo.toUpperCase()) : null
                });
            }
        });"""

html = commit_pattern.sub(new_commit_loop, html)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Expanded columns successfully")
