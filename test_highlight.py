with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()
    if 'style="background:#fef08a' in html:
        print('SUCCESS: Highlight code found in HTML')
    else:
        print('FAILED: Highlight code NOT found')
