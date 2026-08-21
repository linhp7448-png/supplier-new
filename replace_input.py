import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update the input element itself
old_input = '<input type="file" id="scmFileInput" accept=".xlsx, .csv" style="display:none;" />'
new_input = '<input type="file" id="scmFileInput" accept=".xlsx, .xls, .csv, image/*" multiple style="display:none;" />'
html = html.replace(old_input, new_input)
# There is a second old_input if they duplicated it? Let's also check .xlsx, .xls
old_input2 = '<input type="file" id="scmFileInput" accept=".xlsx, .xls" style="display:none;" />'
html = html.replace(old_input2, new_input)

# 2. Hide the bulk image button from the toolbar
# Replace: <button id="btnBulkImg" class="tbtn" style="margin-left:12px; background:#f0f2f5; border:1px solid #c9cdd4; color:#2b6cb0" onclick="document.getElementById(\'bulkImgInput\').click()">🖼 Tải nhiều ảnh</button>
# With: empty string (or just hide it)
html = html.replace('<button id="btnBulkImg" class="tbtn" style="margin-left:12px; background:#f0f2f5; border:1px solid #c9cdd4; color:#2b6cb0" onclick="document.getElementById(\'bulkImgInput\').click()">🖼 Tải nhiều ảnh</button>', '')
html = html.replace('<button id="btnBulkImg" class="tbtn" style="margin-left:12px; background:#f0f2f5; border:1px solid #c9cdd4; color:#2b6cb0" onclick="document.getElementById(\'bulkImgInput\').click()">🖼 Tải nhiu ảnh</button>', '')

# 3. Modify existData fetch to include image_url
old_select = ".select('rid, loc_code, vendor_code, item_no, sub_desc, brand, purch_unit, conversion, base_unit, moq, mov, ship_if, hsd, storage').range(exFrom, exFrom + exSize - 1)"
new_select = ".select('rid, loc_code, vendor_code, item_no, sub_desc, brand, purch_unit, conversion, base_unit, moq, mov, ship_if, hsd, storage, image_url').range(exFrom, exFrom + exSize - 1)"
html = html.replace(old_select, new_select)

# We must also update existMap logic to include image_url in hash? Actually, if image_url changes, it should flag MODIFIED!
# Let's replace the existMap hash string
old_exist_hash = "const hash = [r.sub_desc, r.brand, r.purch_unit, r.conversion, r.base_unit, r.moq, r.mov, r.ship_if, r.hsd, r.storage].join('|');"
new_exist_hash = "const hash = [r.sub_desc, r.brand, r.purch_unit, r.conversion, r.base_unit, r.moq, r.mov, r.ship_if, r.hsd, r.storage, r.image_url].join('|');"
html = html.replace(old_exist_hash, new_exist_hash)


with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
    print("Pre-requisites replaced successfully.")
