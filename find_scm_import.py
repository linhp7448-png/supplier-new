with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('document.getElementById(\'scmFileInput\')')
if idx == -1:
    idx = html.find('document.getElementById("scmFileInput")')

if idx != -1:
    # Just print the next 2000 characters from that occurrence
    print(html[idx:idx+2000].encode('utf-8').decode('cp1252', 'ignore'))
else:
    print("Not found document.getElementById")

# Search without document.getElementById
idx2 = html.find("scmFileInput')?.addEventListener('change'")
if idx2 != -1:
    print(html[idx2:idx2+2000].encode('utf-8').decode('cp1252', 'ignore'))
