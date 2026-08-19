import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace _supabase with sb in the imported logic
html = html.replace('_supabase.from', 'sb.from')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Replaced _supabase with sb")
