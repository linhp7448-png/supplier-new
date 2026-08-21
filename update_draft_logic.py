import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

start_str = 'const toInsert = [];'
end_str = 'await loadScmIntoIMD(); // Load newly inserted data into table'
start_idx = html.find(start_str)
end_idx = html.find(end_str) + len(end_str)

new_logic = '''
              window.SCM_DRAFT = [];
              let draftRows = [];
              
              rawDataArray.forEach((r, idx) => {
                  const key = r.loc_code + '|' + r.vendor_code + '|' + r.item_no;
                  const hash = [r.sub_desc, r.brand, r.purch_unit, r.conversion, r.base_unit, r.moq, r.mov, r.ship_if, r.hsd, r.storage].join('|');
                  
                  let status = 'NEW';
                  let warning = '';
                  
                  if (existMap.has(key)) {
                      const exist = existMap.get(key);
                      r.rid = exist.rid;
                      if (exist.hash !== hash) {
                          status = 'MODIFIED';
                          // AI Heuristic: Check if UOM or specs changed significantly
                          const oldStr = exist.hash.split('|');
                          const newStr = hash.split('|');
                          if (oldStr[2] !== newStr[2] || oldStr[4] !== newStr[4]) {
                              warning = '🚩 Đơn vị tính (UOM) bị thay đổi, cần kiểm tra kỹ!';
                          } else if (Math.abs(Number(oldStr[5]||0) - Number(newStr[5]||0)) > (Number(oldStr[5]||1)*0.5)) {
                             warning = '🚩 Thông số thay đổi bất thường (>50%)!';
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
'''

if start_idx != -1 and end_idx != -1:
    html = html[:start_idx] + new_logic + html[end_idx:]
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Replaced scmFileInput logic")
else:
    print("Could not find replacement strings")
