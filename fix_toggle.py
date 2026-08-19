import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Save rows to a global variable inside imRender
html = html.replace('var vis = COLS.filter(', 'window._currentImRows = rows;\n      var vis = COLS.filter(')

# 2. Update imToggleAll to use the global variable
old_toggle = """function imToggleAll(checked) {
      rows.slice(0, 500).forEach(function(r) {"""
new_toggle = """function imToggleAll(checked) {
      (window._currentImRows || []).slice(0, 500).forEach(function(r) {"""

html = html.replace(old_toggle, new_toggle)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Fixed select all bug")
