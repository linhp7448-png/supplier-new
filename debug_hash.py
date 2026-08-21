import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_warning_code = """if (exist.hash !== hash) {
                        status = 'MODIFIED';
                        const oldStr = exist.hash.split('|');
                        const newStr = hash.split('|');
                        if (oldStr[2] !== newStr[2]) {
                            warning = '🚩 Đơn vị tính (UOM) bị thay đổi!';
                        }
                    }"""

new_warning_code = """if (exist.hash !== hash) {
                        status = 'MODIFIED';
                        const oldStr = exist.hash.split('|');
                        const newStr = hash.split('|');
                        let diffs = [];
                        const fields = ['Specs', 'Brand', 'UOM', 'Conv', 'Base', 'MOQ', 'MOV', 'ShipIf', 'HSD', 'Storage', 'Img'];
                        for (let i=0; i<oldStr.length; i++) {
                            if (oldStr[i] !== newStr[i]) {
                                diffs.push(fields[i] + ' {' + oldStr[i] + '} => {' + newStr[i] + '}');
                            }
                        }
                        warning = '⚠️ Khác: ' + diffs.join('; ');
                    }"""

if old_warning_code in html:
    html = html.replace(old_warning_code, new_warning_code)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated warning code")
else:
    print("Could not find old warning code")
