import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Using regex to insert the help button exactly after the small tag ends
pattern = re.compile(r'(<small[^>]*>Bạn có thể gõ trực tiếp hoặc Copy từ Excel.*?</small>)(</div>)')
replacement = r"\1" + " <span style='display:inline-block;margin-left:10px'>" + r"' + imHelpBtn('multi_add') + '" + r"</span>\2"

html = pattern.sub(replacement, html)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Added Help button successfully")
