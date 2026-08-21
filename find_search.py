with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
    # Find 'imPage=1;imRender()'
    idx = html.find('imPage=1;imRender()')
    if idx != -1:
        # dump 200 chars around it
        print(html[idx-100:idx+200].encode('utf-8').decode('cp1252', 'ignore'))
