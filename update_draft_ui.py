import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the table header
old_th = '<th>Vendor</th><th>Location</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay đổi</th>'
new_th = '<th>Vendor</th><th>Location</th><th>Hình ảnh</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay đổi</th>'
if old_th in html:
    html = html.replace(old_th, new_th)
else:
    # Maybe encoded differently
    old_th2 = '<th>Vendor</th><th>Location</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay ổi</th>'
    html = html.replace(old_th2, new_th)
    
# Find the row generation logic
# root += '<tr style="background:' + bg + '"><td><input type="checkbox" id="chk_draft_' + idx + '" ' + (x._checked ? 'checked' : '') + '></td>' +
#         '<td>' + esc(imVal(x, 'vendor_code')) + '</td><td>' + esc(imVal(x, 'loc_code')) + '</td><td>' + '<a href="#">' + esc(imVal(x, 'item_no')) + '</a></td><td>' +
#         esc(imVal(x, 'sub_desc')) + '</td><td>' + esc(imVal(x, 'brand')) + '</td><td>' + esc(imVal(x, 'purch_unit')) + ' (' + esc(imVal(x, 'conversion')) + ' ' + esc(imVal(x, 'base_unit')) + ')</td>' +
#         '<td>' + esc(imVal(x, 'moq')) + '</td><td>' +
#         '<span class="impill ' + statusClass + '">' + statusText + '</span>' + (x._warning ? '<br><span style="color:#c53030;font-size:11px;font-weight:600;display:inline-block;margin-top:4px">' + x._warning + '</span>' : '') + '</td></tr>';

old_td = "'<td>' + esc(imVal(x, 'vendor_code')) + '</td><td>' + esc(imVal(x, 'loc_code')) + '</td><td>' + '<a href=\"#\">' + esc(imVal(x, 'item_no')) + '</a></td><td>'"
new_td = "'<td>' + esc(imVal(x, 'vendor_code')) + '</td><td>' + esc(imVal(x, 'loc_code')) + '</td><td>' + (x.image_url ? '<img src=\"'+x.image_url+'\" style=\"max-height:40px;border-radius:4px\"/>' : '<span style=\"color:#999\">No img</span>') + '</td><td>' + '<a href=\"#\">' + esc(imVal(x, 'item_no')) + '</a></td><td>'"

if old_td in html:
    html = html.replace(old_td, new_td)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Replaced draft view HTML to include image")
else:
    print("Could not find row generation block")
