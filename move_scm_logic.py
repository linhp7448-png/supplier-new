import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Extract the injected logic
start_marker = "    // --- SCM IMPORT LOGIC ---"
end_marker = "    // --- END SCM IMPORT LOGIC ---"

if start_marker in html and end_marker in html:
    start_idx = html.find(start_marker)
    end_idx = html.find(end_marker) + len(end_marker)
    
    extracted = html[start_idx:end_idx]
    
    # 2. Remove it from its current location
    html = html[:start_idx] + html[end_idx:]
    
    # 3. Append it right before the last closing script tag, which is right before </body>
    last_script_end = html.rfind("  </script>")
    if last_script_end != -1:
        html = html[:last_script_end] + extracted + "\n  </script>" + html[last_script_end + 11:]
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print("Moved SCM logic to the bottom")
    else:
        print("Could not find last script tag")
else:
    print("Could not find markers")
