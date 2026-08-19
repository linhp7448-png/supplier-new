import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Clean up my previous mistakes
html = html.replace('''          <a class="nav-item" id="nav-scm" onclick="showView('scm-view'); loadScmData();">Hàng hóa SCM</a>''', '')
html = re.sub(r'    <!-- SCM VIEW -->.*?<!-- VENDOR DETAIL VIEW -->', '    <!-- VENDOR DETAIL VIEW -->', html, flags=re.DOTALL)
html = html.replace('''
        <button class="navi navmain" onclick="showView('scm-view'); loadScmData();" data-tip="Nhập xuất và hợp nhất dữ liệu SCM từ Database">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 5h16v14H4zM8 5v14M4 10h16M4 15h16" />
          </svg>Hàng hóa SCM (Mới)
        </button>''', '')
html = re.sub(r'  document\.getElementById\("scm-view"\)\.style\.display = \(viewId === "scm-view"\) \? "block" \: "none";\n', '', html)

# 2. Add the "Nhập SCM từ Excel" button exactly into the "Sản phẩm hợp nhất" toolbar
target_toolbar = "onclick=\"imSmartOpen()\">+ Thêm / thay sản phẩm</button>' : '') +"
new_button = "onclick=\"imSmartOpen()\">+ Thêm / thay sản phẩm</button>' : '') + (st.itemtab === 'list' ? '<button class=\"tbtn\" style=\"margin-left:12px; background:#f0f2f5; border:1px solid #c9cdd4\" onclick=\"document.getElementById(\\'scmFileInput\\').click()\">📥 Nhập SCM từ Excel</button>' : '') +"

if new_button not in html:
    html = html.replace(target_toolbar, new_button)

# 3. Add the invisible file input if it doesn't exist (since I removed it from scm-view)
file_input = '<input type="file" id="scmFileInput" accept=".xlsx, .csv" style="display:none;" />'
if file_input not in html:
    html = html.replace('</body>', file_input + '\n</body>')

# 4. Modify the SCM LOGIC to append the fetched data directly to IMD and re-render the Golden Record
new_logic = """
// --- SCM LOGIC ---
document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const contentDiv = document.getElementById('content');
  const oldContent = contentDiv.innerHTML;
  contentDiv.innerHTML = '<div class="imempty">Đang đẩy dữ liệu SCM lên Cloud... Xin vui lòng đợi!</div>';
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const data = event.target.result;
      const workbook = XLSX.read(data, {type: 'array'});
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      if (rows.length === 0) { alert("File rỗng!"); contentDiv.innerHTML = oldContent; return; }
      
      const sanitizeNum = (val) => {
        if (val == null || val === '') return null;
        if (typeof val === 'string') val = val.replace(/,/g, '');
        const num = Number(val);
        return isNaN(num) ? null : num;
      };
      
      const locationsMap = new Map();
      const itemsMap = new Map();
      const rawDataArray = [];
      
      for (const row of rows) {
        const locCode = row['Location Code'];
        const vendorCode = row['Vendor Code'];
        const itemNo = row['Item No'];
        if (locCode) locationsMap.set(locCode, { loc_code: locCode, region: row['Region'] || 'Unknown' });
        if (itemNo) itemsMap.set(itemNo, { item_no: itemNo, description: row['Description'], category: row['Category'] || 'Other' });
        
        if (locCode && vendorCode && itemNo) {
          rawDataArray.push({
            loc_code: locCode, vendor_code: vendorCode, item_no: itemNo,
            sub_desc: row['Sub Description'] || null, brand: row['Brand'] || null,
            purch_unit: row['Purchase Unit'] || row['Purch. Unit'] || null, conversion: sanitizeNum(row['Conversion']),
            base_unit: row['Base Unit'] || null, moq: sanitizeNum(row['MOQ / PO']), mov: sanitizeNum(row['MOV / PO']),
            ship_if: row['SHIP if <MOQ/MOV'] || null, hsd: sanitizeNum(row['HSD (Ngày)']),
            storage: row['Storage'] || row['Điều kiện bảo quản'] || null
          });
        }
      }
      
      if (locationsMap.size > 0) await _supabase.from('locations').upsert(Array.from(locationsMap.values()));
      if (itemsMap.size > 0) await _supabase.from('items').upsert(Array.from(itemsMap.values()));
      
      for (let i = 0; i < rawDataArray.length; i += 500) {
        await _supabase.from('raw_data').upsert(rawDataArray.slice(i, i + 500));
      }
      
      alert("Đã nhập dữ liệu thành công!");
      await loadScmIntoIMD(); // Load newly inserted data into table
    } catch(err) {
      console.error(err);
      alert("Lỗi khi nhập liệu: " + err.message);
      contentDiv.innerHTML = oldContent;
    }
    document.getElementById('scmFileInput').value = '';
  };
  reader.readAsArrayBuffer(file);
});

async function loadScmIntoIMD() {
    try {
        const { data: rawData, error } = await _supabase.from('raw_data').select('*, items!inner(description, category), vendor(name)');
        if (error) throw error;
        if (!rawData) return;
        
        // Remove old SCM items from IMD to avoid duplicates
        IMD = IMD.filter(item => !item['_is_scm']);
        
        const mapped = rawData.map(r => ({
            'CATEGORY': r.items.category,
            'DOMAIN': 'SCM F&B',
            'ITEM CODE': r.item_no,
            'ITEM NAME': r.items.description,
            'SUB ITEM CODE': r.item_no,
            'SUB ITEM NAME': r.sub_desc || r.items.description,
            'Purchase UOM': r.purch_unit,
            'Base UOM': r.base_unit,
            'Purchase Price': r.conversion,
            'BRAND': r.brand || '',
            'VENDOR_CODE': r.vendor_code,
            'VENDOR_NAME': r.vendor?.name || r.vendor_code,
            'Valid To': r.hsd ? r.hsd + ' Ngày' : '',
            'Status': 'Active',
            '_is_scm': true
        }));
        
        IMD = IMD.concat(mapped);
        imRender(); // Re-render the golden record list
    } catch (e) {
        console.error("Failed to load SCM data", e);
    }
}

// Call loadScmIntoIMD when opening Item Management
const _originalShowView = showView;
showView = function(v) {
    _originalShowView(v);
    if (v === 'itemmgmt' && !window._scmLoaded) {
        window._scmLoaded = true;
        loadScmIntoIMD();
    }
}
// --- END SCM LOGIC ---
"""
# Replace the old logic
html = re.sub(r'// --- SCM LOGIC ---.*?// --- END SCM LOGIC ---', new_logic, html, flags=re.DOTALL)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Done fixing index.html")
