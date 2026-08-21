import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find the second function imRender()
idx1 = html.find('function imRender()')
idx2 = html.find('function imRender()', idx1 + 1)

if idx2 != -1:
    end_idx = html.find('    function imStatus', idx2)
    old_func = html[idx2:end_idx]
    
    # We will just replace the specific lines
    old_line1 = "if (!IMD) return; var t = st.itemtab || 'work', root; if (['items', 'subs', 'content', 'uom', 'offers', 'requests'].includes(t)) {"
    
    new_line1 = "if (!IMD && st.itemtab !== 'scm_draft') return; var t = st.itemtab || 'work', root;\n      if (t === 'scm_draft') { root = imScmDraftView(); }\n      else if (['items', 'subs', 'content', 'uom', 'offers', 'requests'].includes(t)) {"
    
    if old_line1 in old_func:
        new_func = old_func.replace(old_line1, new_line1)
        html = html[:idx2] + new_func + html[end_idx:]
        with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Fixed second imRender")
    else:
        print("Could not find the target line to replace in imRender")
else:
    print("Could not find second imRender")
