import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add button to toolbar
old_toolbar = "'<button class=\"tbtn pri\" style=\"margin-left:12px\" onclick=\"imSmartOpen()\">+ Thêm / thay sản phẩm</button>' : '')"
new_toolbar = "'<button class=\"tbtn pri\" style=\"margin-left:12px\" onclick=\"imSmartOpen()\">+ Thêm / thay sản phẩm</button><button class=\"tbtn\" style=\"margin-left:12px; border:1px solid #c9cdd4; color:#2b6cb0\" onclick=\"imMultiAddOpen()\">+ Thêm nhiều sản phẩm</button>' : '')"
html = html.replace(old_toolbar, new_toolbar)

# Add button to im2actions (the large hero section)
old_actions = '<div class="im2actions"><button class="btn pri" onclick="imSmartOpen()">+ Thêm / thay sản phẩm</button><button class="btn" onclick="imTab(\\'search\\')">Kiểm tra master trước</button></div>'
new_actions = '<div class="im2actions"><button class="btn pri" onclick="imSmartOpen()">+ Thêm / thay sản phẩm</button><button class="btn" style="background:#fff;border:1px solid #ccc;color:#147a52;font-weight:600" onclick="imMultiAddOpen()">+ Thêm nhiều sản phẩm</button><button class="btn" onclick="imTab(\\'search\\')">Kiểm tra master trước</button></div>'
html = html.replace(old_actions, new_actions)

# Now we need to append the imMultiAddOpen() and imMultiAddView() functions.
# Let's add them right before "function imSmartOpen()"
insert_idx = html.find("function imSmartOpen()")

multi_add_code = '''
    function imMultiAddOpen() {
        st.itemtab = 'multi_add';
        if (typeof imRender === 'function') imRender();
    }
    
    function imMultiAddView() {
        var rowsHTML = '';
        for (var i = 0; i < 15; i++) {
            rowsHTML += '<tr>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:200px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:80px"></td>' +
                '</tr>';
        }
        
        var root = '<div class="imbar" style="justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0">' +
                 '<div><b style="color:#166534;font-size:15px">📝 Nhập tay nhiều sản phẩm (Grid)</b><br><small style="color:#14532d">Bạn có thể gõ trực tiếp hoặc Copy từ Excel và Paste (Dán) vào ô đầu tiên để tự động điền.</small></div>' +
                 '<div><button class="tbtn" style="background:#fff;border:1px solid #ccc;margin-right:10px" onclick="st.itemtab=\\'work\\';imRender()">Hủy bỏ</button>' +
                 '<button class="btn pri" style="background:#147a52;border:none" onclick="imMultiAddCommit()">Xác nhận dữ liệu</button></div></div>';
                 
        root += '<div class="impanel" style="padding:0;max-height:calc(100vh - 220px);overflow:auto">' +
                '<table class="imtbl" id="multiAddTable" style="width:100%">' +
                '<thead><tr><th>Vendor Code</th><th>Location</th><th>Item No</th><th>Tên hàng (Specs)</th><th>Brand</th><th>UOM (Quy cách)</th><th>MOQ</th></tr></thead>' +
                '<tbody onpaste="imMultiAddPaste(event)">' + rowsHTML + '</tbody></table>' +
                '<div style="padding:15px"><button class="tbtn" onclick="imMultiAddMoreRows()">+ Thêm 5 dòng</button></div>' +
                '</div>';
        return root;
    }
    
    function imMultiAddMoreRows() {
        var tbody = document.querySelector('#multiAddTable tbody');
        if (!tbody) return;
        var rowsHTML = '';
        for (var i = 0; i < 5; i++) {
            rowsHTML += '<tr>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:200px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:120px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:100px"></td>' +
                '<td contenteditable="true" style="padding:8px;border-bottom:1px solid #eee;outline:none;min-width:80px"></td>' +
                '</tr>';
        }
        tbody.insertAdjacentHTML('beforeend', rowsHTML);
    }
    
    function imMultiAddPaste(e) {
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain');
        if (!text) return;
        
        var rows = text.split(/\\r\\n|\\n|\\r/);
        var targetCell = e.target;
        while (targetCell && targetCell.tagName !== 'TD') targetCell = targetCell.parentElement;
        if (!targetCell) return;
        
        var startRowTr = targetCell.parentElement;
        var startColIdx = Array.from(startRowTr.children).indexOf(targetCell);
        
        var currentTr = startRowTr;
        
        for (var i = 0; i < rows.length; i++) {
            var rowText = rows[i].trim();
            if (!rowText && i === rows.length - 1) continue;
            
            var cols = rowText.split('\\t');
            
            if (!currentTr) {
                imMultiAddMoreRows();
                currentTr = document.querySelector('#multiAddTable tbody').lastElementChild;
                // Go up to the newly added row
                var added = document.querySelector('#multiAddTable tbody').children;
                currentTr = added[added.length - 5]; 
                // This is a naive way to find the newly added row, a better way is to track it.
                // For simplicity, we just keep adding rows until we have enough.
            }
            // Better row logic:
            if (!currentTr) {
                document.querySelector('#multiAddTable tbody').insertAdjacentHTML('beforeend', '<tr><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td></tr>');
                currentTr = document.querySelector('#multiAddTable tbody').lastElementChild;
                var tds = currentTr.querySelectorAll('td');
                tds.forEach(td => { td.style.padding = '8px'; td.style.borderBottom = '1px solid #eee'; td.style.outline = 'none'; });
            }
            
            for (var j = 0; j < cols.length; j++) {
                var targetIdx = startColIdx + j;
                if (targetIdx < currentTr.children.length) {
                    currentTr.children[targetIdx].innerText = cols[j];
                }
            }
            currentTr = currentTr.nextElementSibling;
        }
    }
    
    async function imMultiAddCommit() {
        var tbody = document.querySelector('#multiAddTable tbody');
        if (!tbody) return;
        
        var rawDataArray = [];
        var rows = tbody.querySelectorAll('tr');
        
        const sanitizeNum = (val) => {
            if (val == null || val === '') return null;
            if (typeof val === 'string') val = val.replace(/,/g, '');
            const num = Number(val);
            return isNaN(num) ? null : num;
        };
        
        rows.forEach(tr => {
            var tds = tr.querySelectorAll('td');
            var vendorCode = tds[0].innerText.trim();
            var locCode = tds[1].innerText.trim();
            var itemNo = tds[2].innerText.trim();
            var specs = tds[3].innerText.trim();
            var brand = tds[4].innerText.trim();
            var uom = tds[5].innerText.trim();
            var moqStr = tds[6].innerText.trim();
            
            if (vendorCode && locCode && itemNo) {
                rawDataArray.push({
                    vendor_code: vendorCode,
                    loc_code: locCode,
                    item_no: itemNo,
                    sub_desc: specs,
                    brand: brand,
                    purch_unit: uom,
                    moq: sanitizeNum(moqStr),
                    // Default values for others
                    conversion: null, base_unit: null, mov: null, ship_if: null, hsd: null, storage: null, image_url: null
                });
            }
        });
        
        if (rawDataArray.length === 0) {
            alert("Không có dữ liệu hợp lệ (Cần điền ít nhất Vendor, Location, Item No).");
            return;
        }
        
        // Render loading
        document.getElementById('content').innerHTML = '<div class="imempty">Đang đối chiếu dữ liệu... Xin vui lòng đợi!</div>';
        
        try {
            var existData = [];
            var exFrom = 0, exSize = 1000;
            while (true) {
                const { data: exChunk, error: fetchErr } = await sb.from('raw_data').select('rid, loc_code, vendor_code, item_no, sub_desc, brand, purch_unit, conversion, base_unit, moq, mov, ship_if, hsd, storage, image_url').range(exFrom, exFrom + exSize - 1);
                if (fetchErr) throw fetchErr;
                if (!exChunk || exChunk.length === 0) break;
                existData = existData.concat(exChunk);
                if (exChunk.length < exSize) break;
                exFrom += exSize;
            }
            
            const existMap = new Map();
            (existData || []).forEach(r => {
                const key = r.loc_code + '|' + r.vendor_code + '|' + r.item_no;
                const hash = [r.sub_desc, r.brand, r.purch_unit, r.conversion, r.base_unit, r.moq, r.mov, r.ship_if, r.hsd, r.storage, r.image_url].join('|');
                existMap.set(key, { rid: r.rid, hash: hash, oldImg: r.image_url });
            });
            
            window.SCM_DRAFT = [];
            let draftRows = [];
            
            rawDataArray.forEach((r, idx) => {
                const key = r.loc_code + '|' + r.vendor_code + '|' + r.item_no;
                if (existMap.has(key) && !r.image_url) {
                    r.image_url = existMap.get(key).oldImg;
                }
                const hash = [r.sub_desc, r.brand, r.purch_unit, r.conversion, r.base_unit, r.moq, r.mov, r.ship_if, r.hsd, r.storage, r.image_url].join('|');
                
                let status = 'NEW';
                let warning = '';
                
                if (existMap.has(key)) {
                    const exist = existMap.get(key);
                    r.rid = exist.rid;
                    if (exist.hash !== hash) {
                        status = 'MODIFIED';
                        const oldStr = exist.hash.split('|');
                        const newStr = hash.split('|');
                        if (oldStr[2] !== newStr[2]) {
                            warning = '🚩 Đơn vị tính (UOM) bị thay đổi!';
                        }
                    } else {
                        status = 'UNCHANGED';
                    }
                }
                
                r._status = status;
                r._warning = warning;
                r._checked = (status === 'MODIFIED' || status === 'NEW');
                
                if (status !== 'UNCHANGED') {
                    draftRows.push(r);
                }
            });
            
            window.SCM_DRAFT = draftRows;
            
            if (draftRows.length === 0) {
                alert("Dữ liệu bạn nhập hoàn toàn trùng khớp với hệ thống, không có gì mới để cập nhật!");
                st.itemtab = 'multi_add';
                imRender();
                return;
            }
            
            // Switch to Draft View
            st.itemtab = 'scm_draft';
            imRender();
            
        } catch(e) {
            alert("Lỗi: " + e.message);
            st.itemtab = 'multi_add';
            imRender();
        }
    }
'''

if insert_idx != -1:
    html = html[:insert_idx] + multi_add_code + html[insert_idx:]

# We need to make sure imRender supports multi_add
# Find `if (t === 'scm_draft') { root = imScmDraftView(); }`
# And add `else if (t === 'multi_add') { root = imMultiAddView(); }`
html = html.replace("if (t === 'scm_draft') { root = imScmDraftView(); }", "if (t === 'scm_draft') { root = imScmDraftView(); }\n      else if (t === 'multi_add') { root = imMultiAddView(); }")
html = html.replace("if (!IMD && st.itemtab !== 'scm_draft') return;", "if (!IMD && st.itemtab !== 'scm_draft' && st.itemtab !== 'multi_add') return;")

with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Implemented multi add feature")
