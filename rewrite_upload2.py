import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_str = "document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {"

idx1 = html.find(start_str)
idx2 = html.find(start_str, idx1 + 1)

if idx2 != -1:
    # Just find the ending `reader.readAsArrayBuffer(file);\n    });` 
    # Or in our case, we know it's around `imRender();\n              }\n`
    end_block = html.find("reader.readAsArrayBuffer", idx2)
    end_block_end = html.find("});", end_block) + 3
    
    new_block = '''document.getElementById('scmFileInput')?.addEventListener('change', async function(e) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      const contentDiv = document.getElementById('content');
      const oldContent = contentDiv.innerHTML;
      contentDiv.innerHTML = '<div class="imempty">Đang xử lý dữ liệu và hình ảnh... Xin vui lòng đợi!</div>';
      
      // Phân loại file
      const excelFile = files.find(f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'));
      const imageFiles = files.filter(f => f.type.startsWith('image/'));
      
      if (!excelFile) {
          alert("Không tìm thấy file Excel (.xlsx, .xls) trong các file đã chọn!");
          contentDiv.innerHTML = oldContent;
          return;
      }
      
      // Upload hình ảnh lên Supabase (chạy ngầm)
      const imageUrls = new Map();
      if (imageFiles.length > 0) {
          contentDiv.innerHTML = `<div class="imempty">Đang tải lên ${imageFiles.length} hình ảnh... Xin vui lòng đợi!</div>`;
          try {
              await sb.auth.getSession();
              let successCount = 0;
              for (let i = 0; i < imageFiles.length; i++) {
                  let file = imageFiles[i];
                  let name = file.name;
                  let lastDot = name.lastIndexOf('.');
                  if (lastDot > 0) name = name.substring(0, lastDot);
                  name = name.trim().toUpperCase();
                  
                  const ext = file.name.split('.').pop();
                  const filePath = `${name}-${Date.now()}.${ext}`;
                  
                  const { error } = await sb.storage.from('item_images').upload(filePath, file);
                  if (!error) {
                      const { data: { publicUrl } } = sb.storage.from('item_images').getPublicUrl(filePath);
                      imageUrls.set(name, publicUrl);
                      successCount++;
                  }
              }
              console.log(`Đã upload thành công ${successCount}/${imageFiles.length} ảnh`);
          } catch (err) {
              console.error("Lỗi khi upload ảnh:", err);
          }
      }
      
      contentDiv.innerHTML = '<div class="imempty">Đang đọc file Excel và đối chiếu dữ liệu... Xin vui lòng đợi!</div>';
      
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
          const vendorsMap = new Map();
          const rawDataArray = [];
          
          for (const row of rows) {
            const locCode = row['Location Code'];
            const vendorCode = row['Vendor Code'];
            const itemNo = row['Item No'];
            if (locCode) locationsMap.set(locCode, { loc_code: locCode, region: row['Region'] || 'Unknown' });
            if (itemNo) itemsMap.set(itemNo, { item_no: itemNo, description: row['Description'], category: row['Category'] || 'Other' });
            if (vendorCode) vendorsMap.set(vendorCode, { code: vendorCode, name: row['Vendor'] || row['Vendor Name'] || row['Nhà cung cấp'] || vendorCode });
            
            if (locCode && vendorCode && itemNo) {
              const itemNoUpper = itemNo.toUpperCase();
              rawDataArray.push({
                loc_code: locCode, vendor_code: vendorCode, item_no: itemNo,
                sub_desc: row['Sub Description'] || null, brand: row['Brand'] || null,
                purch_unit: row['Purchase Unit'] || row['Purch. Unit'] || null, conversion: sanitizeNum(row['Conversion']),
                base_unit: row['Base Unit'] || null, moq: sanitizeNum(row['MOQ / PO']), mov: sanitizeNum(row['MOV / PO']),
                ship_if: row['SHIP if <MOQ/MOV'] || null, hsd: sanitizeNum(row['HSD (Ngày)']),
                storage: row['Storage'] || row['Điều kiện bảo quản'] || null,
                // Lấy URL ảnh nếu vừa upload xong
                image_url: imageUrls.has(itemNoUpper) ? imageUrls.get(itemNoUpper) : null
              });
            }
          }
          
          if (vendorsMap.size > 0) {
              const vendorArr = Array.from(vendorsMap.values());
              for (let i = 0; i < vendorArr.length; i += 500) {
                  await sb.from('vendor').upsert(vendorArr.slice(i, i + 500), { onConflict: 'code', ignoreDuplicates: true });
              }
          }
          if (locationsMap.size > 0) await sb.from('locations').upsert(Array.from(locationsMap.values()));
          // Items upsert skipped
          
          if (rawDataArray.length > 0) {
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
                  // Nếu r.image_url là null (chưa upload đợt này), giữ lại image_url cũ
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
                          if (oldStr[2] !== newStr[2] || oldStr[4] !== newStr[4]) {
                              warning = '🚩 Đơn vị tính (UOM) bị thay đổi!';
                          } else if (Math.abs(Number(oldStr[5]||0) - Number(newStr[5]||0)) > (Number(oldStr[5]||1)*0.5)) {
                             warning = '🚩 Thông số thay đổi bất thường (>50%)!';
                          } else if (oldStr[10] !== newStr[10]) {
                             warning = '🖼 Cập nhật hình ảnh mới';
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
                  alert("Không có thay đổi nào mới so với dữ liệu hệ thống!");
                  contentDiv.innerHTML = oldContent;
                  return;
              }
              
              // Switch to Draft View
              st.itemtab = 'scm_draft';
              if (typeof imRender === 'function') {
                  imRender();
              }
          }
        } catch(e) {
          alert("Lỗi đọc file: " + e.message);
          contentDiv.innerHTML = oldContent;
        }
      };
      reader.readAsArrayBuffer(excelFile);
    });'''

    html = html[:idx2] + new_block + html[end_block_end:]
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Replaced scmFileInput logic with multi-file upload successfully.")
else:
    print("Could not find the target scmFileInput listener")
