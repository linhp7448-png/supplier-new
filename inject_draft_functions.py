import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_funcs = '''
    function imScmDraftToggle(idx) {
        if (!window.SCM_DRAFT) return;
        var r = window.SCM_DRAFT[idx];
        if (r) { r._checked = !r._checked; }
    }
    
    async function imScmDraftCommit() {
        if (!window.SCM_DRAFT) return;
        var toInsert = [];
        var toUpdate = [];
        window.SCM_DRAFT.forEach(r => {
            if (r._checked) {
                // Delete temporary UI fields before upload
                let c = Object.assign({}, r);
                delete c._status;
                delete c._warning;
                delete c._checked;
                
                if (r._status === 'NEW') toInsert.push(c);
                else if (r._status === 'MODIFIED') toUpdate.push(c);
            }
        });
        
        const contentDiv = document.getElementById('content');
        const oldContent = contentDiv.innerHTML;
        contentDiv.innerHTML = '<div class="imempty">Đang đẩy dữ liệu SCM lên Cloud... Xin vui lòng đợi!</div>';
        
        try {
            for (let i = 0; i < toInsert.length; i += 500) await sb.from('raw_data').insert(toInsert.slice(i, i + 500));
            for (let i = 0; i < toUpdate.length; i += 500) await sb.from('raw_data').upsert(toUpdate.slice(i, i + 500), { onConflict: 'rid' });
            
            alert(`✅ Cập nhật SCM thành công!\\n- Thêm mới: ${toInsert.length} dòng\\n- Cập nhật: ${toUpdate.length} dòng`);
            window.SCM_DRAFT = null;
            await loadScmIntoIMD();
        } catch(err) {
            console.error(err);
            alert("Lỗi khi nhập liệu: " + err.message);
            contentDiv.innerHTML = oldContent;
        }
    }
    
    function imScmDraftCancel() {
        if (confirm("Bạn có chắc chắn muốn hủy bỏ toàn bộ dữ liệu đang chờ duyệt?")) {
            window.SCM_DRAFT = null;
            st.itemtab = 'list';
            imRender();
        }
    }

    function imScmDraftView() {
      var d = window.SCM_DRAFT || [];
      var root = '<div class="imbar" style="justify-content:space-between;background:#fffbea;border:1px solid #fde493">' +
                 '<div><b style="color:#b7791f;font-size:15px">⚠️ Bản Nháp: Đang chờ duyệt (' + d.length + ' dòng thay đổi)</b><br><small style="color:#744210">Vui lòng rà soát và đánh dấu ☑ các thay đổi hợp lệ trước khi cập nhật vào hệ thống.</small></div>' +
                 '<div><button class="tbtn" style="background:#fff;border:1px solid #ccc;margin-right:10px" onclick="imScmDraftCancel()">❌ Hủy bỏ</button>' +
                 '<button class="btn pri" style="background:#147a52;border:none" onclick="imScmDraftCommit()">✅ Duyệt & Cập Nhật Hệ Thống</button></div></div>';
                 
      root += '<div class="impanel" style="padding:0;max-height:calc(100vh - 220px);overflow:auto"><table class="imtbl"><thead><tr><th style="width:30px">☑</th><th>Vendor</th><th>Location</th><th>Item No</th><th>Specs</th><th>Brand</th><th>UOM</th><th>MOQ</th><th>Thay Đổi</th></tr></thead><tbody>';
      
      d.forEach((x, idx) => {
          var bg = x._status === 'NEW' ? '#f0fff4' : (x._status === 'MODIFIED' ? '#fffff0' : '#fff');
          var st = x._status === 'NEW' ? '<span class="impill ok">MỚI</span>' : '<span class="impill warn">SỬA ĐỔI</span>';
          root += '<tr style="background:' + bg + '"><td><input type="checkbox" ' + (x._checked ? 'checked' : '') + ' onchange="imScmDraftToggle(' + idx + ')"></td>' +
                  '<td>' + esc(x.vendor_code) + '</td>' + 
                  '<td>' + esc(x.loc_code) + '</td>' + 
                  '<td class="imcode">' + esc(x.item_no) + '</td>' + 
                  '<td>' + esc(x.sub_desc) + '</td>' + 
                  '<td>' + esc(x.brand) + '</td>' + 
                  '<td>' + esc(x.purch_unit) + (x.conversion ? ' (' + x.conversion + ' ' + (x.base_unit||'') + ')' : '') + '</td>' + 
                  '<td>' + esc(x.moq) + '</td>' + 
                  '<td>' + st + (x._warning ? '<br><span style="color:#c0392b;font-size:11px;font-weight:bold">' + x._warning + '</span>' : '') + '</td></tr>';
      });
      root += '</tbody></table></div>';
      return root;
    }
'''

idx = html.find('function imOverview()')
if idx != -1:
    html = html[:idx] + new_funcs + html[idx:]
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected draft functions")
else:
    print("Not found")
