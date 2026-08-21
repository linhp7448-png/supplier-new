with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_str = 'oninput="IMQ=this.value;window.imPage=1;imRender()"'
new_str = 'oninput="IMQ=this.value;window.imPage=1;clearTimeout(window.imRenderTimer);window.imRenderTimer=setTimeout(imRender,300)"'

print("Found:", html.count(old_str))
html = html.replace(old_str, new_str)

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated!")
