import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# I need to wrap the addEventListener inside a DOMContentLoaded
old_code = "document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {"
new_code = """window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {"""

html = html.replace(old_code, new_code)

# And close the DOMContentLoaded block
html = html.replace("reader.readAsArrayBuffer(file);\n    });\n\n    async function loadScmIntoIMD", "reader.readAsArrayBuffer(file);\n    });\n});\n\n    async function loadScmIntoIMD")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Wrapped in DOMContentLoaded")
