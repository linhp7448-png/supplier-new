with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find("rawDataArray.push({")
if idx != -1:
    print(html[idx:idx+2500].encode('utf-8').decode('cp1252', 'ignore'))
