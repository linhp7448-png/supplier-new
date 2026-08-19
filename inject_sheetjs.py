import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

sheetjs_tag = '<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>'
if sheetjs_tag not in html:
    html = html.replace('</head>', '  ' + sheetjs_tag + '\n</head>')
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected SheetJS")
else:
    print("SheetJS already present")
