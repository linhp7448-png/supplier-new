import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix imDeleteSelected:
old_delete = """      // Separate SCM items (need API delete) from local static items
      var scmItems = IMD.filter(i => i._is_scm && toDelete.includes(i['Sub Item Code']));
      
      try {
          if (scmItems.length > 0) {
              var scmItemCodes = scmItems.map(i => i['ITEM CODE']);
              // Delete from Supabase. Assuming Sub Item Code = Item Code in SCM integration.
              const { error } = await _supabase.from('raw_data').delete().in('item_no', scmItemCodes);
              if (error) throw error;
          }
          
          // Remove from local memory
          IMD = IMD.filter(i => !toDelete.includes(i['Sub Item Code']));"""

new_delete = """      // Separate SCM items (need API delete) from local static items
      var allRows = window._currentImRows || [];
      var scmItems = allRows.filter(i => i._is_scm && toDelete.includes(i['Sub Item Code']));
      
      try {
          if (scmItems.length > 0) {
              var scmItemCodes = scmItems.map(i => i['Sub Item Code']);
              // Delete from Supabase. Assuming Sub Item Code = Item Code in SCM integration.
              const { error } = await _supabase.from('raw_data').delete().in('item_no', scmItemCodes);
              if (error) throw error;
          }
          
          // Remove from local memory (Golden Record rowsAll and IMD.subItems)
          if (window.IMD && Array.isArray(window.IMD)) {
              window.IMD = window.IMD.filter(i => !toDelete.includes(i['Sub Item Code']));
          } else if (window.IMD && window.IMD.subItems) {
              window.IMD.subItems = window.IMD.subItems.filter(i => !toDelete.includes(i['Sub Item Code']));
          }
          if (window.rowsAll) {
              window.rowsAll = window.rowsAll.filter(i => !toDelete.includes(i['Sub Item Code']));
          }"""

html = html.replace(old_delete, new_delete)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Fixed delete crash")
