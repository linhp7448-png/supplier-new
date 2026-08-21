import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_imbar = """var root = '<div class="imbar" style="justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0">' +
                 '<div><b style="color:#166534;font-size:15px"> Nhập tay nhiu sản phẩm (Grid)</b><br><small style="color:#14532d">Bạn có thể gõ trực tiếp hoặc Copy từ Excel và Paste (Dán) vào ô đầu tiên để tự động đin.</small></div>' +
                 '<div><button class="tbtn" style="background:#fff;border:1px solid #ccc;margin-right:10px" onclick="st.itemtab=\\'work\\';imRender()">Hủy b</button>' +"""

new_imbar = """var root = '<div class="imbar" style="justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0">' +
                 '<div style="display:flex;align-items:center;"><div><b style="color:#166534;font-size:15px"> Nhập tay nhiu sản phẩm (Grid)</b><br><small style="color:#14532d">Bạn có thể gõ trực tiếp hoặc Copy từ Excel và Paste (Dán) vào ô đầu tiên để tự động đin.</small></div>' +
                 '<div style="margin-left:15px">' + imHelpBtn('multi_add') + '</div></div>' +
                 '<div><button class="tbtn" style="background:#fff;border:1px solid #ccc;margin-right:10px" onclick="st.itemtab=\\'work\\';imRender()">Hủy b</button>' +"""

if old_imbar in html:
    html = html.replace(old_imbar, new_imbar)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Added Help button to Multi Add view")
else:
    print("Could not find the old imbar code")
