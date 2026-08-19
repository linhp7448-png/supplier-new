import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add global state for selection if not exists
if 'window.imSelected =' not in html:
    html = html.replace('function imRender() {', 'window.imSelected = window.imSelected || {};\n    function imRender() {')

# 2. Add checkbox header
th_target = "var th = vis.map(function (c) {"
new_th = "var th = '<th style=\"width:30px;text-align:center\"><input type=\"checkbox\" onclick=\"imToggleAll(this.checked)\"></th>' + vis.map(function (c) {"
if "imToggleAll(this.checked)" not in html:
    html = html.replace(th_target, new_th)

# 3. Add checkbox to body rows
tr_target = "return '<tr onclick=\"imRowDetail(\\'' + String(r['Sub Item Code']).replace(/'/g, \"\") + '\\')\" style=\"cursor:pointer\">' + vis.map(function (c) {"
new_tr = """
        var sid = String(r['Sub Item Code']).replace(/'/g, "");
        return '<tr onclick="imRowDetail(\\'' + sid + '\\')" style="cursor:pointer" class="' + (window.imSelected[sid] ? 'sel' : '') + '">' + '<td style="text-align:center" onclick="event.stopPropagation()"><input type="checkbox" onchange="window.imSelected[\\''+sid+'\\']=this.checked;imRender()" ' + (window.imSelected[sid] ? 'checked' : '') + '></td>' + vis.map(function (c) {"""
if "window.imSelected[\\''+sid+'\\']" not in html:
    html = html.replace(tr_target, new_tr)

# 4. Add the delete button to the toolbar
toolbar_target = "<span class=\"count\">" + "rows.length.toLocaleString('vi-VN') + ' sản phẩm</span></div>'"
# The toolbar target in the original code is: + '<span class="count">' + rows.length.toLocaleString('vi-VN') + ' sản phẩm</span></div>'
# Let's add the button if there are selected items
toolbar_code = """
        var selCount = Object.values(window.imSelected).filter(Boolean).length;
        var delBtn = selCount > 0 ? '<button class="tbtn" style="background:#fdecec;color:#c0392b;border:1px solid #c0392b;margin-right:10px" onclick="imDeleteSelected()">🗑 Xóa ' + selCount + ' mục</button>' : '';
"""

html = html.replace("return head + chooser", toolbar_code + "      return head + chooser")
html = html.replace("imFilterUI('IMLFILTER', COLS, rowsAll)", "imFilterUI('IMLFILTER', COLS, rowsAll) + delBtn")

# 5. Add the JavaScript functions to handle toggle and delete
js_functions = """
    function imToggleAll(checked) {
      rows.slice(0, 500).forEach(function(r) {
         window.imSelected[r['Sub Item Code']] = checked;
      });
      imRender();
    }
    
    async function imDeleteSelected() {
      var toDelete = Object.keys(window.imSelected).filter(k => window.imSelected[k]);
      if (toDelete.length === 0) return;
      if (!confirm("Bạn có chắc muốn xóa " + toDelete.length + " sản phẩm đã chọn? Dữ liệu SCM sẽ bị xóa vĩnh viễn khỏi Database!")) return;
      
      $('#content').innerHTML = '<div class="imempty">Đang xóa dữ liệu...</div>';
      
      // Separate SCM items (need API delete) from local static items
      var scmItems = IMD.filter(i => i._is_scm && toDelete.includes(i['Sub Item Code']));
      
      try {
          if (scmItems.length > 0) {
              var scmItemCodes = scmItems.map(i => i['ITEM CODE']);
              // Delete from Supabase. Assuming Sub Item Code = Item Code in SCM integration.
              const { error } = await _supabase.from('raw_data').delete().in('item_no', scmItemCodes);
              if (error) throw error;
          }
          
          // Remove from local memory
          IMD = IMD.filter(i => !toDelete.includes(i['Sub Item Code']));
          window.imSelected = {}; // Clear selection
          alert("Xóa thành công!");
          
      } catch (err) {
          console.error(err);
          alert("Lỗi khi xóa: " + err.message);
      }
      imRender();
    }
"""

if "function imToggleAll(" not in html:
    html = html.replace('function imLSort(k)', js_functions + '\n    function imLSort(k)')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Done adding delete feature")
