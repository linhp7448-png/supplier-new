import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the table header
old_th = '<th>Vendor</th><th>Location</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay đổi</th>'
new_th = '<th>Vendor</th><th>Location</th><th>Item No</th><th>Image</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay đổi</th>'
if old_th in html:
    html = html.replace(old_th, new_th)
else:
    old_th2 = '<th>Vendor</th><th>Location</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay ổi</th>'
    html = html.replace(old_th2, new_th)

# Replace the row generation
old_td = "'<td class=\"imcode\">' + esc(x.item_no) + '</td>' + \\n                  '<td>' + esc(x.sub_desc) + '</td>'"
new_td = "'<td class=\"imcode\">' + esc(x.item_no) + '</td>' + \\n                  '<td>' + (x.image_url ? '<img src=\"'+x.image_url+'\" style=\"max-height:40px;border-radius:4px\"/>' : '<span style=\"color:#999;font-size:11px\">No img</span>') + '</td>' + \\n                  '<td>' + esc(x.sub_desc) + '</td>'"

if old_td in html:
    html = html.replace(old_td, new_td)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Replaced draft view HTML to include image successfully")
else:
    print("Could not find row generation block")
