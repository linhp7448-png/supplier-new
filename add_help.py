import re

with open(r'D:\supplier-new-main\public\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add multi_add to IMHELP
old_imhelp = "var IMHELP = {"
new_imhelp = """var IMHELP = {
      multi_add: {
        icon: '📝', title: 'Thêm nhiu sản phẩm (Grid)',
        rules: [
          'Bảng này ĐÃ ĐỒNG BỘ 100% CỘT với file Excel "Khai báo SP mới" của công ty.',
          'Nên bôi đen và Copy (Ctrl+C) nguyên một dải dữ liệu nhiều dòng nhiều cột từ Excel rồi Paste (Ctrl+V) vào ô đầu tiên để đạt tốc độ tối đa.',
          'Hệ thống tự động thông minh: Dấu phẩy (,) trong các cột số thập phân (như 22,68) sẽ tự chuyển thành dấu chấm chuẩn (22.68).'
        ],
        steps: [
          '<b>B1 (Chép Chữ):</b> Mở Excel, bôi đen các dòng cần thêm, ấn <b>Ctrl + C</b>. Quay lại Web, nhấp vào ô trên cùng bên trái, ấn <b>Ctrl + V</b>.',
          '<b>B2 (Chép Ảnh):</b> Bấm nút <b>📸 Tải ảnh đính kèm</b> ở dưới bảng. Quét chọn nhiều ảnh. <i>Lưu ý: Tên file ảnh phải đặt trùng với cột Mã Hàng (Item No).</i>',
          '<b>B3 (Lưu hệ thống):</b> Bấm <b>Xác nhận dữ liệu</b>. Hệ thống tự động ghép ảnh vào chữ và chuyển qua màn hình Chờ Duyệt (Draft).'
        ]
      },"""

if old_imhelp in html:
    html = html.replace(old_imhelp, new_imhelp)
    with open(r'D:\supplier-new-main\public\index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Added multi_add to IMHELP")
else:
    print("Could not find var IMHELP = {")
