import re
import sys

html_path = 'public/index.html'

try:
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
except FileNotFoundError:
    print(f"Error: Could not find {html_path}")
    sys.exit(1)

# 1. Add SheetJS
if 'xlsx.full.min.js' not in html:
    html = html.replace('</head>', '  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>\n</head>')

# 2. Add Navigation Tab
nav_item_html = """
          <a class="nav-item" id="nav-scm" onclick="showView('scm-view'); loadScmData();">Hàng hóa SCM</a>"""
if 'id="nav-scm"' not in html:
    # Insert after nav-registry
    html = html.replace('onclick="showView(\'registry-view\'); loadRegistry();">Nợ thuế</a>', 
                        'onclick="showView(\'registry-view\'); loadRegistry();">Nợ thuế</a>' + nav_item_html)

# 3. Add SCM View HTML
scm_view_html = """
    <!-- SCM VIEW -->
    <div id="scm-view" class="view-section" style="display:none;">
      <div class="view-header flex justify-between align-center">
        <h2>Sản phẩm hợp nhất (SCM)</h2>
        <div>
            <input type="file" id="scmFileInput" accept=".xlsx, .csv" style="display:none;" />
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('scmFileInput').click()">Nhập Excel</button>
            <button class="btn btn-ghost btn-sm" onclick="loadScmData()">Tải lại</button>
        </div>
      </div>
      <div class="card mt-2">
        <table class="table" id="scm-table">
          <thead>
            <tr>
              <th>Mã hàng</th>
              <th>Tên hàng</th>
              <th>Ngành hàng</th>
              <th>Nhà cung cấp</th>
              <th>Quy đổi (Conversion)</th>
              <th>Bảo quản</th>
              <th>HSD</th>
            </tr>
          </thead>
          <tbody id="scm-table-body">
            <tr><td colspan="7" class="text-center text-gray">Chưa có dữ liệu</td></tr>
          </tbody>
        </table>
      </div>
    </div>
"""
if 'id="scm-view"' not in html:
    # Insert before <div id="vendor-detail-view"
    html = html.replace('    <!-- VENDOR DETAIL VIEW -->', scm_view_html + '\n    <!-- VENDOR DETAIL VIEW -->')

# 4. Add JavaScript Logic
scm_js_logic = """
// --- SCM LOGIC ---
async function loadScmData() {
  const tbody = document.getElementById('scm-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải...</td></tr>';
  
  try {
    const { data: rawData, error } = await _supabase
      .from('raw_data')
      .select(`
        *,
        items!inner(description, category),
        vendor(name)
      `);
      
    if (error) throw error;
    
    if (!rawData || rawData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray">Chưa có dữ liệu</td></tr>';
      return;
    }
    
    tbody.innerHTML = rawData.map(r => `
      <tr>
        <td>${r.item_no}</td>
        <td>${r.items?.description || ''}</td>
        <td><span class="badge ${r.items?.category === 'Concession' ? 'badge-draft' : 'badge-active'}">${r.items?.category || ''}</span></td>
        <td>${r.vendor?.name || r.vendor_code || ''}</td>
        <td>1 ${r.purch_unit || '-'} = ${r.conversion || '-'} ${r.base_unit || '-'}</td>
        <td>${r.storage || ''}</td>
        <td>${r.hsd ? r.hsd + ' Ngày' : ''}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-error text-center">Lỗi: ${err.message}</td></tr>`;
  }
}

document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const tbody = document.getElementById('scm-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Đang xử lý file Excel... Xin vui lòng đợi!</td></tr>';
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const data = event.target.result;
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);
      
      if (rows.length === 0) {
        alert("File rỗng!");
        loadScmData();
        return;
      }
      
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Đang đẩy dữ liệu lên Cloud...</td></tr>';
      
      const sanitizeNum = (val) => {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'string' && val.trim() === '') return null;
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
        const desc = row['Description'];
        const cat = row['Category'] || 'Other';
        const region = row['Region'] || 'Unknown';
        
        if (locCode) locationsMap.set(locCode, { loc_code: locCode, region: region });
        if (itemNo) itemsMap.set(itemNo, { item_no: itemNo, description: desc, category: cat });
        
        if (locCode && vendorCode && itemNo) {
          rawDataArray.push({
            loc_code: locCode,
            vendor_code: vendorCode,
            item_no: itemNo,
            sub_desc: row['Sub Description'] || null,
            brand: row['Brand'] || null,
            purch_unit: row['Purchase Unit'] || row['Purch. Unit'] || null,
            conversion: sanitizeNum(row['Conversion']),
            base_unit: row['Base Unit'] || null,
            moq: sanitizeNum(row['MOQ / PO']),
            mov: sanitizeNum(row['MOV / PO']),
            ship_if: row['SHIP if <MOQ/MOV'] || null,
            hsd: sanitizeNum(row['HSD (Ngày)']),
            storage: row['Storage'] || row['Điều kiện bảo quản'] || null
          });
        }
      }
      
      if (locationsMap.size > 0) await _supabase.from('locations').upsert(Array.from(locationsMap.values()));
      if (itemsMap.size > 0) await _supabase.from('items').upsert(Array.from(itemsMap.values()));
      
      // Upsert raw data in chunks
      const chunkSize = 500;
      for (let i = 0; i < rawDataArray.length; i += chunkSize) {
        const chunk = rawDataArray.slice(i, i + chunkSize);
        await _supabase.from('raw_data').upsert(chunk);
      }
      
      alert("Đã nhập dữ liệu thành công!");
    } catch(err) {
      console.error(err);
      alert("Lỗi khi nhập liệu: " + err.message);
    }
    
    document.getElementById('scmFileInput').value = '';
    loadScmData();
  };
  reader.readAsArrayBuffer(file);
});
// --- END SCM LOGIC ---
"""
if '// --- SCM LOGIC ---' not in html:
    html = html.replace('// --- APP INIT ---', scm_js_logic + '\n// --- APP INIT ---')

# 5. Fix view switching logic to hide scm-view when switching to others
if 'document.getElementById("scm-view").style.display = (viewId === "scm-view") ? "block" : "none";' not in html:
    # Find the function showView(viewId)
    html = re.sub(r'(function showView\(viewId\) \{.*?)(document\.getElementById\("vendor-detail-view"\)\.style\.display = \(viewId === "vendor-detail-view"\) \? "block" \: "none";)', 
                  r'\1\2\n  document.getElementById("scm-view").style.display = (viewId === "scm-view") ? "block" : "none";', 
                  html, flags=re.DOTALL)


with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Successfully injected SCM features into index.html")
