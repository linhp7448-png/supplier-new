import re

html_path = 'public/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

scm_logic = """
    // --- SCM IMPORT LOGIC ---
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
            
            if (window.IMD && window.IMD.subItems) {
                // Remove old SCM items
                window.IMD.subItems = window.IMD.subItems.filter(item => !item['_is_scm']);
                
                const mappedSubs = rawData.map(r => ({
                    'Item Code': r.item_no,
                    'Sub Item Code': r.item_no + '-' + r.vendor_code,
                    'Sub Item Name': r.sub_desc || r.items.description,
                    'Brand': r.brand || '',
                    'Purchase UOM': r.purch_unit,
                    'Conversion': r.conversion,
                    'Base UOM': r.base_unit,
                    'Shelf Life Days': r.hsd,
                    'Storage': r.storage,
                    'Status': 'Active',
                    '_is_scm': true,
                    // Vendor details usually mapped via 'offers' or directly here if custom list view allows it
                    'Vendor Name': r.vendor?.name || r.vendor_code
                }));
                
                window.IMD.subItems = window.IMD.subItems.concat(mappedSubs);
                
                // Add dummy offers to link vendor properly
                if (!window.IMD.offers) window.IMD.offers = [];
                window.IMD.offers = window.IMD.offers.filter(o => !o['_is_scm']);
                
                const mappedOffers = rawData.map(r => ({
                    'Offer ID': 'OFFER-SCM-' + r.vendor_code + '-' + r.item_no,
                    'Sub Item Code': r.item_no + '-' + r.vendor_code,
                    'Vendor Code': r.vendor_code,
                    'Vendor Name': r.vendor?.name || r.vendor_code,
                    'Location Code': r.loc_code,
                    'Purchase UOM': r.purch_unit,
                    'Conversion': r.conversion,
                    'Base UOM': r.base_unit,
                    'MOQ': r.moq,
                    '_is_scm': true
                }));
                window.IMD.offers = window.IMD.offers.concat(mappedOffers);
                
                alert("Đã tự động tải dữ liệu SCM vào lưới Golden Record!");
                // Trigger re-render by switching back to the view
                st.itemtab = 'list';
                imRender(); 
            }
        } catch (e) {
            console.error("Failed to load SCM data", e);
        }
    }
    // --- END SCM IMPORT LOGIC ---
"""

# Check if it was already added to prevent duplicates
if '// --- SCM IMPORT LOGIC ---' not in html:
    # Inject it right before the closing script tag
    html = html.replace('  </script>', scm_logic + '\n  </script>')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Injected SCM import logic")
else:
    print("SCM logic already present")
