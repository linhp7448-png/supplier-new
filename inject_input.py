import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

input_tag = '<input type="file" id="scmFileInput" accept=".xlsx, .csv" style="display:none;" />'

if 'id="scmFileInput"' not in html or input_tag not in html:
    # If the tag is completely missing, inject it right before </body>
    if input_tag not in html:
        html = html.replace('</body>', '  ' + input_tag + '\n</body>')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print("Injected input tag")
    else:
        print("Tag already present")
else:
    print("Tag is present")
