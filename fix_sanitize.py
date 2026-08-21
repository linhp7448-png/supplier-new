import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_sanitize = """const sanitizeNum = (val) => {
            if (val == null || val === '') return null;
            if (typeof val === 'string') val = val.replace(/,/g, '');
            const num = Number(val);
            return isNaN(num) ? null : num;
        };"""

new_sanitize = """const sanitizeNum = (val) => {
            if (val == null || val === '') return null;
            if (typeof val === 'string') {
                val = val.trim();
                // Nếu là dạng 22,68 (1-2 số thập phân sau dấu phẩy) -> Đổi phẩy thành chấm
                if (/^-?\\d+,\\d{1,2}$/.test(val)) {
                    val = val.replace(',', '.');
                } else {
                    // Nếu là dạng 1,000 (dấu phẩy ngàn) -> Xóa phẩy
                    val = val.replace(/,/g, '');
                }
            }
            const num = Number(val);
            return isNaN(num) ? null : num;
        };"""

if old_sanitize in html:
    # Need to replace the SECOND occurrence (which is inside imMultiAddCommit)
    # Actually, we can replace all occurrences to be safe, since the one in scmFileInput has the exact same code.
    html = html.replace(old_sanitize, new_sanitize)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed sanitizeNum")
else:
    print("Could not find sanitizeNum")
