import re

with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

print("Locations of scmFileInput:")
for m in re.finditer('scmFileInput', html):
    start = max(0, m.start() - 50)
    end = min(len(html), m.start() + 50)
    print(f"Index {m.start()}: {html[start:end]}")
