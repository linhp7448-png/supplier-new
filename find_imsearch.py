with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('function imSearchResults()')
if idx != -1:
    print(html[idx:idx+800].encode('utf-8').decode('cp1252', 'ignore'))
