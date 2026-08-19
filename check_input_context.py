import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'<input[^>]*id=[\'\"]scmFileInput[\'\"][^>]*>', html)
if match:
    start = max(0, match.start() - 100)
    end = min(len(html), match.end() + 100)
    print("Found exact tag context:")
    print(html[start:end])
else:
    print("NOT FOUND!")
