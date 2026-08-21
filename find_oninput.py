import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

matches = re.findall(r'oninput="[^"]*"', html)
for m in set(matches):
    print(m)
