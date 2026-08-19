import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# I need to add await sb.auth.getSession(); to the start of loadScmIntoIMD
old_code = "async function loadScmIntoIMD() {\n        try {"
new_code = "async function loadScmIntoIMD() {\n        try {\n            await sb.auth.getSession(); // Ensure session is loaded before querying"

html = html.replace(old_code, new_code)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Added getSession() to loadScmIntoIMD")
