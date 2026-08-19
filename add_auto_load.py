import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Add call to loadScmIntoIMD at the end of imLoadV2
target = "var count = {}; IMD.subItems.forEach(function (s) { count[imVal(s, 'Item Code')] = (count[imVal(s, 'Item Code')] || 0) + 1; }); IMD.items.forEach(function (i) { i['Sub Item Count'] = count[imVal(i, 'Item Code')] || 0; });"
replacement = target + "\n      try { await loadScmIntoIMD(); } catch(e) { console.error('SCM load error', e); }"

if "await loadScmIntoIMD();" not in target and replacement not in html:
    html = html.replace(target, replacement)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Added auto-load for SCM data")
else:
    print("Already added")
