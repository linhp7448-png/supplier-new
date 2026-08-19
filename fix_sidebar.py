import sys

html_path = 'public/index.html'
try:
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
except FileNotFoundError:
    print(f"Error: Could not find {html_path}")
    sys.exit(1)



sidebar_target = '          </svg>Quản lý Nhà cung cấp</button>'
scm_btn = """
        <button class="navi navmain" onclick="showView('scm-view'); loadScmData();" data-tip="Nhập xuất và hợp nhất dữ liệu SCM từ Database">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 5h16v14H4zM8 5v14M4 10h16M4 15h16" />
          </svg>Hàng hóa SCM (Mới)
        </button>"""

if 'Hàng hóa SCM (Mới)' not in html:
    html = html.replace(sidebar_target, sidebar_target + scm_btn)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Fixed sidebar button!")
