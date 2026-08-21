// ============================================================
//  SUPABASE MOCK — Demo mode with FULL EXCEL CONTRACTS & CERTIFICATES DATA
//  File: supplier_management-main new/public/supabase-mock.js
// ============================================================

(function(){
const _USERS = [
  {id:'u-admin-001', email:'sonbn@galaxystudio.vn', role:'Admin'},
  {id:'u-admin-002', email:'admin@galaxy.vn', role:'Admin'}
];
let _session = null;
let _authCbs = [];

const _vendors = [
{"id": "v-OCEAN", "code": "OCEAN", "name": "", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000001", "code": "VD0000001", "name": "Cinema - Công Ty CP Truyền Thông Điện ảnh Sài Gòn", "mst": "0300469868", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000002", "code": "VD0000002", "name": "Cinema - Doanh nghiep - Công Ty TNHH Lotte Cinema VN", "mst": "0300644051", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000003", "code": "VD0000003", "name": "Cinema - Platinum Royal - Chi nhánh Công Ty TNHH truyền thông Bạch Kim M.V.P", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000004", "code": "VD0000004", "name": "Công Ty TNHH Truyền Thông Bạch Kim M.V.P", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000005", "code": "VD0000005", "name": "CTY TNHH nhà hàng thiên phước", "mst": "0312725273", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000006", "code": "VD0000006", "name": "CTy TNHH MTV SX TM Thời Trang Thế Việt", "mst": "0313191754", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000007", "code": "VD0000007", "name": "Chi Cục Hải Quan Chuyển Phát Nhanh", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000008", "code": "VD0000008", "name": "Chi Nhánh Công Ty CP BIGSUN", "mst": "0104944404-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000009", "code": "VD0000009", "name": "Cty TNHH Thiết Bị Sự Kiện Sài Gòn", "mst": "0313349712", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000010", "code": "VD0000010", "name": "Công Ty CP CPN New Post", "mst": "0311915440", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000011", "code": "VD0000011", "name": "Công Ty CP DV Bảo vệ Mạnh Cường", "mst": "0309133125", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000012", "code": "VD0000012", "name": "Công Ty Cổ phần Fim Plus", "mst": "0106539659", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000013", "code": "VD0000013", "name": "Công Ty TNHH Bao Bì UNITED", "mst": "0302541950", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000014", "code": "VD0000014", "name": "Công Ty TNHH Công Nghiệp Thực Phẩm LIWAYWAY SàI gòN", "mst": "3701308172", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000015", "code": "VD0000015", "name": "Công Ty TNHH Cơ Điện Lạnh Tân Và Kỳ", "mst": "0302895540", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000016", "code": "VD0000016", "name": "Công Ty TNHH Cẩm Tú", "mst": "0304487956", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000017", "code": "VD0000017", "name": "Công Ty TNHH Hậu Kỳ Kantana Việt nam", "mst": "0306268036", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000018", "code": "VD0000018", "name": "Công Ty TNHH MTV IPP", "mst": "0311509329", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000019", "code": "VD0000019", "name": "Công Ty TNHH SX TM DV XNK Thuận Lợi", "mst": "0301043896", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000020", "code": "VD0000020", "name": "Công Ty TNHH SX TM Việt Hoa Mỹ", "mst": "0306833707", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000021", "code": "VD0000021", "name": "Công Ty TNHH Thực Phẩm Pepsico Việt Nam", "mst": "3702139167", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000022", "code": "VD0000022", "name": "Công Ty TNHH Thực Phẫm Sen Việt", "mst": "0310217161", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000023", "code": "VD0000023", "name": "Công Ty TNHH Công Nghiệp Thực Phẩm Liwayway Đà Nẵng", "mst": "0401466327", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000024", "code": "VD0000024", "name": "Công Ty TNHH MTV TMDV Siêu Thị Coop Mart Đà Nẵng", "mst": "0401281414", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000025", "code": "VD0000025", "name": "Công Ty TNHH TM & DV Tin Học Điện Tử Viễn Thông CTE", "mst": "0400462506", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000026", "code": "VD0000026", "name": "Công Ty TNHH TM DV XD và Công Nghệ Môi Trường Lâm Nhật Thiên", "mst": "3701871113", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000027", "code": "VD0000027", "name": "Cơ sở Kinh doanh KNP - MeKong", "mst": "8215654568", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000028", "code": "VD0000028", "name": "CH thiết bị Trắc Địa", "mst": "0304528930", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000029", "code": "VD0000029", "name": "CH thực phẩm cao cấp phương hà 2", "mst": "8131988405", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000030", "code": "VD0000030", "name": "Chi Nhánh Biên Hòa - Công Ty Cổ Phần Pizza Ngon", "mst": "0104115527-005", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000031", "code": "VD0000031", "name": "CN 3 CTY TNHH Ru Nam", "mst": "3700330954-003", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000032", "code": "VD0000032", "name": "Chi Nhánh Bến Tre Công Ty CP viễn thông FPT", "mst": "0101778163-041", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000033", "code": "VD0000033", "name": "CN CT TNHH Nippon Paint (Vietnam) - Tại TP.Hồ Chí Minh", "mst": "3600244941-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000034", "code": "VD0000034", "name": "Chi Nhánh Công Ty CP DV TM TP.HCM Kissho Japanese Restaurant", "mst": "0301827763-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000035", "code": "VD0000035", "name": "Chi Nhánh Công Ty CP Phượng Hoàng", "mst": "0100639311-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000036", "code": "VD0000036", "name": "Chi Nhánh Công Ty CP thực phẩm Takahiro", "mst": "0312301845-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000037", "code": "VD0000037", "name": "Chi Nhánh Công Ty CP viễn thông FPT", "mst": "0101778163-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000038", "code": "VD0000038", "name": "CN CTY CP Đầu Tư TM QT Mặt Trời Đỏ", "mst": "0102646635-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000039", "code": "VD0000039", "name": "Chi Nhánh Công Ty TNHH Aeon VN", "mst": "0311241512-003", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000040", "code": "VD0000040", "name": "Chi Nhánh Công Ty TNHH Eat Facory VN - nhà hàng manmaru", "mst": "0312914792-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000041", "code": "VD0000041", "name": "Chi Nhánh Công Ty TNHH LG elecronics VN tạị TP.HCM", "mst": "0900108493-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000042", "code": "VD0000042", "name": "Chi Nhánh Công Ty TNHH MTV Đa Niềm Tin - nhà hàng TP sư tử", "mst": "0304973811-004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000043", "code": "VD0000043", "name": "Chi Nhánh Công Ty TNHH Quốc tế Lê Kiên", "mst": "0305349388-008", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000044", "code": "VD0000044", "name": "CN CTY TNHH TP tân việt nhật", "mst": "0306340691-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000045", "code": "VD0000045", "name": "Chi Nhánh Công Ty TNHH phòng ăn - Nhà Hàng Ngọt Nhật Lê Lợi", "mst": "0306024583-010", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000046", "code": "VD0000046", "name": "Chi Nhánh Công Ty TNHH phòng ăn - nhà hàng ngọt nhật vivo", "mst": "0306024583-012", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000047", "code": "VD0000047", "name": "Chi Nhánh Công Ty TNHH Nước Giải Khát Suntory Pepsico Việt Nam tại Tỉnh Bắc Ninh", "mst": "0300816663-007", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000048", "code": "VD0000048", "name": "CN Công Ty CP Thông Minh MK", "mst": "2500218495-003", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000049", "code": "VD0000049", "name": "CN Công Ty Cp Phim Thiên Ngân Bến Tre- Công Ty Mẹ", "mst": "0101595681-004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000050", "code": "VD0000050", "name": "CN Công Ty Cp Phim Thiên Ngân HCM- Công Ty Mẹ", "mst": "0101595681-004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000051", "code": "VD0000051", "name": "CN Công Ty Cp Phim Thiên Ngân Đà Nẵng- Công Ty Mẹ", "mst": "0101595681-005", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000052", "code": "VD0000052", "name": "Công Ty CP Tập Đoàn Golden Gate - CN Miền Nam", "mst": "0102721191-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000053", "code": "VD0000053", "name": "CN Công Ty CP Bitexco Nam Long", "mst": "1000341509-003", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000054", "code": "VD0000054", "name": "CN Công Ty CP Dịch Vụ Bưu Chính Viễn Thông Sài Gòn - Bưu cục Trung tâm KV1", "mst": "0300849034-007", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000055", "code": "VD0000055", "name": "Chi Nhánh Công Ty CP thương mại dịch vụ Hoàng Hải", "mst": "0305124786-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000056", "code": "VD0000056", "name": "CN Công Ty Cổ Phần Phim Thiên Ngân ( Tp Hà Nội)", "mst": "0101595681-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000057", "code": "VD0000057", "name": "Chi Nhánh Công Ty Cổ phần Logistics Vinalink", "mst": "0301776205-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000058", "code": "VD0000058", "name": "CN Công Ty TNHH MTV Viễn thông Quốc tế FPT", "mst": "0305793402-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000059", "code": "VD0000059", "name": "CN Công Ty TNHH Thương mại SX Khăn giấy Trung Thành tại Bắc Ninh", "mst": "0101507727 001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000060", "code": "VD0000060", "name": "CN Công Ty TNHH không hải vận tại Hà nội", "mst": "0305285198-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000061", "code": "VD0000061", "name": "CN Liên Hiệp HTX TM TPHCM Coop Mart Bến Tre", "mst": "0301175691-013", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000062", "code": "VD0000062", "name": "Chi Nhánh Tại TP. HCM - Công Ty TNHH TM DV và Phân phối Tổng hợp (Tp. Hà Nội)", "mst": "0102313379-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000063", "code": "VD0000063", "name": "Chi Nhánh Tổng Công Ty DV Viễn Thông", "mst": "0106869738-005", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000064", "code": "VD0000064", "name": "Chi Nhánh Tổng Công Ty Du lịch SG - TNHH MTV làng du lịch Bình Quới", "mst": "0300625210-030", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000065", "code": "VD0000065", "name": "Chi Nhánh nhà hàng diểm tâm baoz - Công Ty TNHH MTV chế biến TP Thọ Phát", "mst": "0311173534-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000066", "code": "VD0000066", "name": "CONG TY TNHH GIAI TRI-TRUYEN THONG PHUONG NAM", "mst": "0311053501", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000067", "code": "VD0000067", "name": "Công Ty CP In Trường Tín", "mst": "0305135273", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000068", "code": "VD0000068", "name": "CT CP QC Truyền Thông Thiên Hy Long Việt Nam", "mst": "0302229420", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000069", "code": "VD0000069", "name": "CT CP TM Dịch Vụ Du Lịch Duyên Dáng Việt", "mst": "0304905829", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000070", "code": "VD0000070", "name": "CT CP Xây Dựng Số 5", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000071", "code": "VD0000071", "name": "CT TNHH Colorfull", "mst": "0311767707", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000072", "code": "VD0000072", "name": "CT TNHH DV Truyền Thông Phương Đông", "mst": "0313291188", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000073", "code": "VD0000073", "name": "CT TNHH MIA FRUIT", "mst": "0312931780", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000074", "code": "VD0000074", "name": "CT TNHH MTV Cimigo", "mst": "0303939751", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000075", "code": "VD0000075", "name": "CT TNHH MTV Huệ Phát", "mst": "0309362220", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000076", "code": "VD0000076", "name": "Công Ty TNHH Rentokil Initial (Việt Nam)", "mst": "0304819489", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000077", "code": "VD0000077", "name": "CT TNHH TM DV ADN FIM", "mst": "0313154142", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000078", "code": "VD0000078", "name": "CT TNHH TM DV Đồng Thịnh", "mst": "0309881794", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000079", "code": "VD0000079", "name": "CT TNHH TV KS XD Tổng Hợp H.A.I", "mst": "0303241967", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000080", "code": "VD0000080", "name": "CT TNHH Truyền Thông và Dịch Vụ WIN", "mst": "0314111663", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000081", "code": "VD0000081", "name": "CTY CP Capella D1", "mst": "0311936673", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000082", "code": "VD0000082", "name": "Công Ty Cổ Phần CareerBuilder", "mst": "0303284985", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000083", "code": "VD0000083", "name": "CTY CP DL CĐ - KS nhà hàng rạng đông", "mst": "0302575621", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000084", "code": "VD0000084", "name": "CTY CP DV TM tổng hợp Vincommerce", "mst": "0104918404", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000085", "code": "VD0000085", "name": "CTY CP Dược Phẩm ECO", "mst": "0102637020", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000086", "code": "VD0000086", "name": "CTY CP FDG", "mst": "0312758649", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000087", "code": "VD0000087", "name": "CTY CP TM - XD- TTNT ánh sáng mới", "mst": "0305670986", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000088", "code": "VD0000088", "name": "CTY CP TM Hàng không miền nam Wammi", "mst": "0303583819", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000089", "code": "VD0000089", "name": "CTY CP Thảo Mộc Xanh", "mst": "0310698627", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000090", "code": "VD0000090", "name": "CTY CP Trung Nguyên Franchising", "mst": "0310939343", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000091", "code": "VD0000091", "name": "Công Ty CP chuyển phát nhanh của PCS - Newpost", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000092", "code": "VD0000092", "name": "CTY CP một bốn một", "mst": "0311843309", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000093", "code": "VD0000093", "name": "CTY CP taxi Hà Nội", "mst": "0101537520", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000094", "code": "VD0000094", "name": "CTY CP Đại Việt Toàn Cầu", "mst": "0310683525", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000095", "code": "VD0000095", "name": "CTY TNHH An Phước Long", "mst": "0312362171", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000096", "code": "VD0000096", "name": "CTY TNHH DV VT ngọc trung", "mst": "0304877748", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000097", "code": "VD0000097", "name": "CTY TNHH DV vận tải Hà Lâm", "mst": "0311938007", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000098", "code": "VD0000098", "name": "CTY TNHH Golden Link VN", "mst": "0309030828", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000099", "code": "VD0000099", "name": "CTY TNHH Goldenduck International VN", "mst": "0312269292", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000100", "code": "VD0000100", "name": "CTY TNHH HIIP", "mst": "0313875232", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000101", "code": "VD0000101", "name": "CTY TNHH Indochina Land River Garden", "mst": "0313369571", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000102", "code": "VD0000102", "name": "CTY TNHH Lottecinema VN", "mst": "0302575928", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000103", "code": "VD0000103", "name": "CTY TNHH MTV Nguyễn Nguyễn Hoàng", "mst": "0309737751", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000104", "code": "VD0000104", "name": "CTY TNHH MTV Phạm Anh", "mst": "0306060655", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000105", "code": "VD0000105", "name": "CTY TNHH MTV TM DV TT gia nguyễn", "mst": "4001041133", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000106", "code": "VD0000106", "name": "CTY TNHH MTV TM PT Phú Gia Khang", "mst": "0313123715", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000107", "code": "VD0000107", "name": "CTY TNHH MTV TM Phúc Tài Thịnh", "mst": "0309520163", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000108", "code": "VD0000108", "name": "CTY TNHH MTV Thiết bị PCCC Thuận Thành", "mst": "1301011712", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000109", "code": "VD0000109", "name": "CTY TNHH Mỹ Thuật Trà Quế", "mst": "0311224563", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000110", "code": "VD0000110", "name": "CTY TNHH Paperstory", "mst": "0313054797", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000111", "code": "VD0000111", "name": "CTY TNHH SX TM DV Hưng nguyễn phát", "mst": "0310904735", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000112", "code": "VD0000112", "name": "CTY TNHH SX TM Hồng Phúc", "mst": "0304195079", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000113", "code": "VD0000113", "name": "CTY TNHH Speedex", "mst": "0310612637", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000114", "code": "VD0000114", "name": "Công Ty TNHH Một Thành Viên Sài Gòn CO.OP Phú Lâm - Co.op Mart Phú Lâm", "mst": "0305761111", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000115", "code": "VD0000115", "name": "CTY TNHH TM BCO", "mst": "0312306466", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000116", "code": "VD0000116", "name": "CTY TNHH TM DV Flower Studio", "mst": "0311856410", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000117", "code": "VD0000117", "name": "CTY TNHH TM DV KT Đa truyền thông ngôi sao mới", "mst": "0310914733", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000118", "code": "VD0000118", "name": "CTY TNHH TM DV Kha Di", "mst": "0307985290", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000119", "code": "VD0000119", "name": "CTY TNHH TM DV Nguyễn Nhân", "mst": "0312129619", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000120", "code": "VD0000120", "name": "CTY TNHH TM DV Nhà hàng Hương Đồng Quê", "mst": "0314017283", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000121", "code": "VD0000121", "name": "Công Ty TNHH TM DV VTO Phúc Thịnh", "mst": "0313034896", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000122", "code": "VD0000122", "name": "CTY TNHH TM DV nhà hàng phi long viên", "mst": "0313172286", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000123", "code": "VD0000123", "name": "CTY TNHH TM DV nhà hàng Đại Dương", "mst": "0314037459", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000124", "code": "VD0000124", "name": "CTY TNHH TM DV song mỹ", "mst": "0313855980", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000125", "code": "VD0000125", "name": "CTY TNHH TM Tân Bạch Dương", "mst": "0301873713", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000126", "code": "VD0000126", "name": "Công Ty TNHH TM VPP Minh Khôi", "mst": "0305837755", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000127", "code": "VD0000127", "name": "CTY TNHH Thuận Lê", "mst": "0306164492", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000128", "code": "VD0000128", "name": "CTY TNHH Thời trang sao Việt", "mst": "0309264978", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000129", "code": "VD0000129", "name": "CTY TNHH Truyền Thông Và Quảng Cáo Nhà Sói", "mst": "0312969939", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000130", "code": "VD0000130", "name": "CTY TNHH Truyền thông Làn sóng", "mst": "0313663936", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000131", "code": "VD0000131", "name": "CTY TNHH Tập đoàn Bitexco Bitexco Group - CTY TNHH Bitexco Văn Phòng", "mst": "0313331592", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000132", "code": "VD0000132", "name": "CTY TNHH Tổ chức Sự Kiện Sài Gòn Light", "mst": "0313768738", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000133", "code": "VD0000133", "name": "Công Ty TNHH Vận Hành Vincom Retail", "mst": "0106250673", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000134", "code": "VD0000134", "name": "CTY TNHH XD Minh Chương", "mst": "0301394189", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000135", "code": "VD0000135", "name": "CTY TNHH Xây dựng Quảng cáo Kim Ngân", "mst": "0309521375", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000136", "code": "VD0000136", "name": "CTY TNHH Yến Sào Bình Định", "mst": "0312564097", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000137", "code": "VD0000137", "name": "CTY TNHH in kiến.VN", "mst": "0400491306", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000138", "code": "VD0000138", "name": "CTY TNHH nhà hàng a chảy", "mst": "0313472804", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000139", "code": "VD0000139", "name": "CTY TNHH nhà hàng số 8 thị xuân", "mst": "0313986817", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000140", "code": "VD0000140", "name": "CTY TNHH tin học điện tử viễn thông An Phong", "mst": "0311014439", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000141", "code": "VD0000141", "name": "CTY TNHH tư vấn tiếp thị nghệ thuật ACE", "mst": "0312472939", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000142", "code": "VD0000142", "name": "CTY ĐT XD TM DV thọ an", "mst": "3700817152", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000143", "code": "VD0000143", "name": "CTy CP Đầu Tư Phát Triển Đan Phong", "mst": "0312346123", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000144", "code": "VD0000144", "name": "CTy TNHH E.X.B", "mst": "0312836720", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000145", "code": "VD0000145", "name": "CTy TNHH Megaman VN", "mst": "0309673681", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000146", "code": "VD0000146", "name": "Chi Nhánh - Cty TNHH DKSH Việt Nam tại Hà Nội", "mst": "3700303206-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000147", "code": "VD0000147", "name": "Chi Nhánh Công Ty TNHH Nước Giải Khát Suntory PEPSICO Việt Nam Tại Quảng Nam", "mst": "0300816663-002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000148", "code": "VD0000148", "name": "Chi Nhánh Hà Nội - Công Ty Cổ Phần Giải Pháp Kỹ Thuật Việt", "mst": "0310069971-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000149", "code": "VD0000149", "name": "Chi cục Hải quan CK Sân bay Quốc tế Nội Bài", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000150", "code": "VD0000150", "name": "Chu Thị Mai Hương", "mst": "0102634319", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000151", "code": "VD0000151", "name": "Chung Bích Phương", "mst": "0100924950", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000152", "code": "VD0000152", "name": "Chung Lệ Thủy", "mst": "0101256417", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000153", "code": "VD0000153", "name": "Chuyển Phát Nhanh 247 Express", "mst": "0304043037", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000154", "code": "VD0000154", "name": "Cinema - Công Ty CP truyền thông Điện ảnh Sài Gòn", "mst": "0300469868", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000155", "code": "VD0000155", "name": "Cinema - Fafilm Saigon Cinema - Công Ty CP Fafim TP HCM", "mst": "0310861104", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000156", "code": "VD0000156", "name": "Cinema - Mega Can Tho Coop Mart - CN Công Ty TNHH Truyền Thông Megastar", "mst": "0303675393-010", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000157", "code": "VD0000157", "name": "Cinema - Mega Canary Binh duong - Công Ty TNHH CJ CGV Việt nam - CN Canary", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000158", "code": "VD0000158", "name": "Cinema - Mega Danang Cinema - CN Công Ty TNHH TT Megastar tại Đà Nẵng", "mst": "0303675393-004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000159", "code": "VD0000159", "name": "Cinema - Mega Ha Noi Cinema (Vincom) - CN Công Ty TNHH Truyền thông Megastar tại Hà nội", "mst": "0303675393-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000160", "code": "VD0000160", "name": "Cinema - Mega Hai Phong Cinema - CN Công Ty TNHH Megastar tại Hải Phòng", "mst": "0303675393-003", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000161", "code": "VD0000161", "name": "Cinema - Mega Hung Vuong Cinema - Công Ty TNHH Truyền thông Megastar", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000162", "code": "VD0000162", "name": "Cinema - Mega Pandora - CN Công Ty TNHH Truyền Thông Megastar Cineplex - Pandora", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000163", "code": "VD0000163", "name": "Cinema - Mega Pico Mall - CN Công Ty TNHH Truyền thông Megastar", "mst": "0303675393-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000164", "code": "VD0000164", "name": "Cinema - Mega Thu Duc CGV", "mst": "0303675393-018", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000165", "code": "VD0000165", "name": "Cinema - Mega Vivo - CN Công Ty TNHH CJ CGV Việt nam - Chi nhánh Vivo city", "mst": "", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000166", "code": "VD0000166", "name": "Cinema - Mega aeon Binh tan - Công Ty TNHH CJ CGV Việt nam - CN Bình tân", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000167", "code": "VD0000167", "name": "Cinema - National Cinema Center NCC - Trung Tâm Chiếu Phim Quốc Gia", "mst": "0100777978-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000168", "code": "VD0000168", "name": "Cinema - Platinum Cineplex HN - Công Ty Cổ phần Giải Trí BHD - MVP", "mst": "0104213122", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000169", "code": "VD0000169", "name": "Co quan - CLB TDTT Nguyen Du", "mst": "0302694851", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000170", "code": "VD0000170", "name": "Công Ty CP Care VN", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000171", "code": "VD0000171", "name": "Cty CP Cấp Nước Chợ Lớn", "mst": "0304797806", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000172", "code": "VD0000172", "name": "Công Ty CP Phượng Hoàng", "mst": "0100639311", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000173", "code": "VD0000173", "name": "Cty CP Tiếp Thị Và Truyền Thông Unique", "mst": "0106470492", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000174", "code": "VD0000174", "name": "Cty CP Truyền Thông Mục Tiêu", "mst": "0308613023", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000175", "code": "VD0000175", "name": "Cty CP Xây Dựng và Kết cấu thép Trường Phú - CN Bình Dương", "mst": "0302735586-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000176", "code": "VD0000176", "name": "Cty Cổ Phần Hóa Dầu Quân Đội", "mst": "0101436307", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000177", "code": "VD0000177", "name": "Cty TNHH Bán Lẻ Arimi", "mst": "0107467894", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000178", "code": "VD0000178", "name": "Cty TNHH 1 Thành Viên Hãng Phim Truyện Việt Nam", "mst": "0100110221", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000179", "code": "VD0000179", "name": "Công Ty TNHH Công Nghiệp Thực Phẩm LIWAYWAY Hà Nội", "mst": "2300275432", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000180", "code": "VD0000180", "name": "Công Ty TNHH DKSH Việt Nam", "mst": "3700303206", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000181", "code": "VD0000181", "name": "Cty TNHH DV Bảo Vệ Chuyên Nghiệp An Ninh Việt Nam", "mst": "0106879824", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000182", "code": "VD0000182", "name": "Cty TNHH DV TM Hà Nội", "mst": "0100235679", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000183", "code": "VD0000183", "name": "Cty TNHH DV TM Tân Cường Minh", "mst": "0302082954", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000184", "code": "VD0000184", "name": "Cty TNHH DV Truyền Thông Phương Đông", "mst": "0313291188", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000185", "code": "VD0000185", "name": "Cty TNHH EV Entertainment", "mst": "0105858282", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000186", "code": "VD0000186", "name": "Cty TNHH Kỹ Thuật Khang Vinh", "mst": "0312031571", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000187", "code": "VD0000187", "name": "Công Ty TNHH Logistics MLC ITL", "mst": "0310914187", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000188", "code": "VD0000188", "name": "Cty TNHH MTV Kaizen L.A.B - Nhà Hàng Sushi Tel", "mst": "0312881554", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000189", "code": "VD0000189", "name": "Cty TNHH MTV Leed Way", "mst": "0310952986", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000190", "code": "VD0000190", "name": "Cty TNHH MTV Sắc Màu Xì Tin", "mst": "0309426185", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000191", "code": "VD0000191", "name": "Cty TNHH MTV TM DV Siêu Thị Coopmart Đà Nẵng", "mst": "0401281414", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000192", "code": "VD0000192", "name": "Công Ty TNHH Nông Sản Thực Phẩm Phúc Anh", "mst": "0310916233", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000193", "code": "VD0000193", "name": "Cty TNHH Nước Uống Tinh Khiết Praha", "mst": "0106706331", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000194", "code": "VD0000194", "name": "Cty TNHH Sản Xuất, TM và DV Đức Việt", "mst": "0101040538", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000195", "code": "VD0000195", "name": "Cty TNHH Sóng Xuân", "mst": "0101903350", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000196", "code": "VD0000196", "name": "Cty TNHH TM DV Gia Bùi", "mst": "4500586414", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000197", "code": "VD0000197", "name": "Cty TNHH TM DV In ấn Khánh Hải", "mst": "0312994276", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000198", "code": "VD0000198", "name": "Cty TNHH TM Galaxy Water Solutions", "mst": "0311945766", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000199", "code": "VD0000199", "name": "Công Ty TNHH TM Khải Thanh", "mst": "0302075280", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000200", "code": "VD0000200", "name": "Cty TNHH TM Song Hằng", "mst": "0300896919", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000201", "code": "VD0000201", "name": "Cty TNHH TM Và KT Đồng Tiến", "mst": "0312538266", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000202", "code": "VD0000202", "name": "Công Ty TNHH TM và DV và XNK Phương Hiền", "mst": "0101909867", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000203", "code": "VD0000203", "name": "Công Ty TNHH TM và Xuất Nhập Khẩu Minh Châu", "mst": "0101389216", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000204", "code": "VD0000204", "name": "Cty TNHH TMDV Tấn Liên", "mst": "0306263221", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000205", "code": "VD0000205", "name": "Công Ty TNHH Thang Máy ThyssenKrupp Việt Nam", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000206", "code": "VD0000206", "name": "Công Ty TNHH Thiên Ngân", "mst": "0100367153", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000207", "code": "VD0000207", "name": "Cty TNHH Tư Vấn XD Sao Việt", "mst": "0309917955", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000208", "code": "VD0000208", "name": "Cty TNHH Vật Tư Kỹ Thuật Thăng Tiến", "mst": "0101293338", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000209", "code": "VD0000209", "name": "Công Ty TNHH Xấy dựng và Thương mại Sài Gòn 3", "mst": "0301447786", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000210", "code": "VD0000210", "name": "Cty TNHH XD TM DL Hồng Ngọc Hà", "mst": "0301479499", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000211", "code": "VD0000211", "name": "Cty TNHH in ấn - quảng cáo Nguyệt Châu", "mst": "0309543516", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000212", "code": "VD0000212", "name": "Cty TNHH Đầu Tư Phát Triển DV Long Tiến", "mst": "0305479394", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000213", "code": "VD0000213", "name": "Cty TNHh DV QC Số Vòng Quanh", "mst": "0310207156", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000214", "code": "VD0000214", "name": "Cty Xăng Dầu Bến Tre - Cửa hàng xăng dầu Phú Khương", "mst": "1300118981", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000215", "code": "VD0000215", "name": "Công Ty TNHH Đầu Tư và Phát Triển Dịch Vụ Truyền Thông Bin", "mst": "0311145625", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000216", "code": "VD0000216", "name": "Công Ty Bảo Hiểm Bưu Điện Sài Gòn Tổng Công Ty CP Bảo Hiểm Bưu Điện", "mst": "0100774631-020", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000217", "code": "VD0000217", "name": "Công Ty CP Công Nghệ Phòng Cháy Chữa Cháy TST", "mst": "0104866354", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000218", "code": "VD0000218", "name": "Công Ty CP EURASIA CONCEPT", "mst": "0312403269", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000219", "code": "VD0000219", "name": "Công Ty CP Hoàng Gia DL", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000220", "code": "VD0000220", "name": "Công Ty CP Kiến Trúc Và Xây Dựng Trí á", "mst": "0305975635", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000221", "code": "VD0000221", "name": "Công Ty CP Lawsoft", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000222", "code": "VD0000222", "name": "Công Ty CP Phượng Hoàng", "mst": "3900388528", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000223", "code": "VD0000223", "name": "Công Ty CP TM XD TTNT ánh sáng mới", "mst": "0305670986", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000224", "code": "VD0000224", "name": "Công Ty CP Tư Vấn Thiết Kế Kiểm Định Xây Dựng Nhà Tây", "mst": "0303608291", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000225", "code": "VD0000225", "name": "Công Ty CP Xây Dựng Khang Hy", "mst": "0305742648", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000226", "code": "VD0000226", "name": "Công Ty CP Đầu Tư Công Nghệ MHP", "mst": "0311124791", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000227", "code": "VD0000227", "name": "Công Ty Cổ Phần Blueseed", "mst": "0312589246", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000228", "code": "VD0000228", "name": "Công Ty Cổ Phần Care VN", "mst": "0304904014", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000229", "code": "VD0000229", "name": "Công Ty Cổ Phần Công Nghệ Thang Máy Phương Đông", "mst": "0304590953", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000230", "code": "VD0000230", "name": "Công Ty Cổ Phần DV Di Động Trực Tuyến", "mst": "0305289153", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000231", "code": "VD0000231", "name": "Công Ty Cổ Phần Kiến Trúc Gia Kiến", "mst": "0309139247", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000232", "code": "VD0000232", "name": "Công Ty Cổ Phần Phim Thiên Ngân - Chi Nhánh Bến Tre", "mst": "0101595681-004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000233", "code": "VD0000233", "name": "Công Ty Cổ Phần Phim Thiên Ngân - Chi Nhánh Đà Nẳng", "mst": "0101595681-005", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000234", "code": "VD0000234", "name": "Công Ty Cổ Phần Xuất Nhập Khẩu Bến Tre", "mst": "1300104040", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000235", "code": "VD0000235", "name": "Công Ty Cổ Phần Đầu Tư Và Sản Xuất Phim Đại Sứ Trẻ", "mst": "0313491606", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000236", "code": "VD0000236", "name": "Công Ty Cổ phần Vĩnh Sơn", "mst": "0301249022", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000237", "code": "VD0000237", "name": "Công Ty Pepsico Việt Nam - CTy TNHH Nước Giải Khát Suntory Pepsico VN", "mst": "0300816663", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000238", "code": "VD0000238", "name": "Công Ty TNHH A Company Việt Nam", "mst": "0106773049", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000239", "code": "VD0000239", "name": "Công Ty TNHH An Ninh", "mst": "0101368456", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000240", "code": "VD0000240", "name": "Công Ty TNHH Bảo Hiểm Liberty", "mst": "0304732887", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000241", "code": "VD0000241", "name": "Công Ty TNHH CATPRO", "mst": "0106856464", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000242", "code": "VD0000242", "name": "Công Ty TNHH CN Thực Phẫm LIWAYWAY Sài Gòn", "mst": "3701308172", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000243", "code": "VD0000243", "name": "Công Ty TNHH Cao Phong", "mst": "0302309845", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000244", "code": "VD0000244", "name": "Công Ty TNHH Chu Thị", "mst": "0303486004", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000245", "code": "VD0000245", "name": "Công Ty TNHH Dart Chocolate", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000246", "code": "VD0000246", "name": "Công Ty TNHH Du Lịch Trần Việt", "mst": "0301069809", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000247", "code": "VD0000247", "name": "Công Ty TNHH G.P", "mst": "0301916131", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000248", "code": "VD0000248", "name": "Công Ty TNHH Giải Trí Lê Bảo Trung", "mst": "0309728757", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000249", "code": "VD0000249", "name": "Công Ty TNHH Kỹ Nghệ Phúc Anh", "mst": "0101417128", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000250", "code": "VD0000250", "name": "Công Ty TNHH Linh Thanh Tuyền", "mst": "0303389963", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000251", "code": "VD0000251", "name": "Công Ty TNHH MM MeGa Market (Việt Nam)", "mst": "0302249586", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000252", "code": "VD0000252", "name": "Công Ty TNHH MTV Dịch Vụ Bảo Vệ - Vệ Sĩ Huỳnh Long Hải", "mst": "1300937620", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000253", "code": "VD0000253", "name": "Công Ty TNHH MTV LQ International", "mst": "0311970674", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000254", "code": "VD0000254", "name": "Công Ty TNHH MTV SX TM DV Minh Nghị", "mst": "0305283151", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000255", "code": "VD0000255", "name": "Công Ty TNHH MTV Song Giao Quốc Tế", "mst": "0305674469", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000256", "code": "VD0000256", "name": "Công Ty TNHH MTV TM DV DL Thành Phố", "mst": "0305829458", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000257", "code": "VD0000257", "name": "Công Ty TNHH MTV Thiết Kế IN ấn và Dịch vụ Quảng Cáo Nét Việt", "mst": "0314025622", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000258", "code": "VD0000258", "name": "Công Ty TNHH MTV World Elites", "mst": "0312637718", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000259", "code": "VD0000259", "name": "Công Ty TNHH MTV XNK Nông Lâm hải sản", "mst": "0311207864", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000260", "code": "VD0000260", "name": "Công Ty TNHH MTV XNK Thái Hùng", "mst": "0306724137", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000261", "code": "VD0000261", "name": "Công Ty TNHH Máy Tính Phong Vũ", "mst": "0400573005", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000262", "code": "VD0000262", "name": "Công Ty TNHH Một Thành Viên Thực Phẩm Happi", "mst": "0311547525", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000263", "code": "VD0000263", "name": "Công Ty TNHH Nippon Paint Việt Nam", "mst": "3600244941-001", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000264", "code": "VD0000264", "name": "Công Ty TNHH Nước Đá Quỳnh Mai", "mst": "0313859336", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000265", "code": "VD0000265", "name": "Công Ty TNHH Nội Thất Toàn Thiên ấn", "mst": "0305019799", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000266", "code": "VD0000266", "name": "Công Ty TNHH Phim Năm Sao", "mst": "0101801817", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000267", "code": "VD0000267", "name": "CT TNHH Phương NAm T.B.T", "mst": "1300942860", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000268", "code": "VD0000268", "name": "Công Ty TNHH Phúc Song Long", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000269", "code": "VD0000269", "name": "Công Ty TNHH SX TM DV Hoàng Tâm", "mst": "0311585471", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000270", "code": "VD0000270", "name": "Công Ty TNHH SX TM Thạnh Nghĩa", "mst": "0314096422", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000271", "code": "VD0000271", "name": "Công Ty TNHH SX TM XD DV Hoàng Nam", "mst": "0302202186", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000272", "code": "VD0000272", "name": "Công Ty TNHH Sofa Company VN", "mst": "3702265669", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000273", "code": "VD0000273", "name": "Công Ty TNHH Sơn Toa Việt Nam", "mst": "3700226914", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000274", "code": "VD0000274", "name": "Công Ty TNHH TM DV KT Điện Quang Huy", "mst": "0313631483", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000275", "code": "VD0000275", "name": "Công Ty TNHH TM DV Three Spoons", "mst": "0", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000276", "code": "VD0000276", "name": "Công Ty TNHH TM Và DV Linh Khôi", "mst": "0304888002", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000277", "code": "VD0000277", "name": "Công Ty TNHH TM Và Nội Thất Hoàng Kim", "mst": "0312022739", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000278", "code": "VD0000278", "name": "Công Ty TNHH TM Và Vận Tải Tín Việt", "mst": "0314092234", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000279", "code": "VD0000279", "name": "Công Ty TNHH TM và DV Sen Nam Thanh", "mst": "0103188868", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000280", "code": "VD0000280", "name": "Công Ty TNHH TM Đa Kết Nối", "mst": "0306140170", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000281", "code": "VD0000281", "name": "Công Ty TNHH TM ánh Ngọc Thanh", "mst": "0304499359", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000282", "code": "VD0000282", "name": "Công Ty TNHH TMDV Sao Nam An", "mst": "0303609778", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000283", "code": "VD0000283", "name": "Công Ty TNHH MTV Thương Mại Sài Gòn - Bến Tre", "mst": "1300419650", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000284", "code": "VD0000284", "name": "Công Ty TNHH Thành Nhân", "mst": "0400309829", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000285", "code": "VD0000285", "name": "Công Ty TNHH Thế Giới Na Vi Việt Nam", "mst": "0101439474", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000286", "code": "VD0000286", "name": "Công Ty TNHH Tick And Pick", "mst": "0313780573", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000287", "code": "VD0000287", "name": "Công Ty TNHH Trang Trí Nội Thất Chuồn Chuồn", "mst": "0303272348", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000288", "code": "VD0000288", "name": "Công Ty TNHH XD Và TM Vạn Kiến Thành", "mst": "0306980571", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000289", "code": "VD0000289", "name": "Công Ty TNHH ẩm Thực Hoàng Mao", "mst": "0313476950", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000290", "code": "VD0000290", "name": "Công Ty Bảo Hiểm Bưu Điện Bến Thành", "mst": "0100774631-024", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000291", "code": "VD0000291", "name": "Công Ty CP Comicola", "mst": "0313105297", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000292", "code": "VD0000292", "name": "Công Ty CP mực in và thiết bị văn phòng Gia Long", "mst": "0105917650", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000293", "code": "VD0000293", "name": "Công Ty CP phát triển và dịch vụ THiên Sơn", "mst": "0107232331", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000294", "code": "VD0000294", "name": "Công Ty CP thương mại - dịch vụ - xây dựng Thuận Hùng", "mst": "0304929185", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000295", "code": "VD0000295", "name": "Công Ty CP thương mại dịch vụ Cổng Vàng", "mst": "0102721191", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000296", "code": "VD0000296", "name": "Công Ty CP Truyền Thông Và Giải Trí Galaxy", "mst": "0106173154", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000297", "code": "VD0000297", "name": "Công Ty CP truyền thông Đa giác", "mst": "0102998443", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000298", "code": "VD0000298", "name": "Công Ty CP Đầu Tư Thương Mại & Dịch vụ Minh Thanh", "mst": "0103076843", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000299", "code": "VD0000299", "name": "Công Ty Cổ Phần Chef Meat Việt Nam", "mst": "0401541454", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000300", "code": "VD0000300", "name": "Công Ty Cổ Phần Lê Minh MC", "mst": "0303029456", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000301", "code": "VD0000301", "name": "Công Ty Cổ Phần Mai Linh Miền Bắc", "mst": "0101149623", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000302", "code": "VD0000302", "name": "Công Ty Cổ phần BigSun", "mst": "0104944404", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000303", "code": "VD0000303", "name": "Công Ty Cổ phần Dịch vụ Hàng Hoá Nội Bài", "mst": "1011640729", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000304", "code": "VD0000304", "name": "CT Cổ phần Phim Thiên Ngân", "mst": "0101595681", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000305", "code": "VD0000305", "name": "Công Ty Cổ phần Thương mại và Dịch vụ Hoa Sơn", "mst": "0101787947", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000306", "code": "VD0000306", "name": "Công Ty Cổ phần Vận tải Đường sắt Hà nội", "mst": "0100106264", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000307", "code": "VD0000307", "name": "Công Ty Cổ phần thương mại máy tính Thái Vinh", "mst": "0105824815", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000308", "code": "VD0000308", "name": "Công Ty Cổ phần Đon Việt", "mst": "0103968339", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000309", "code": "VD0000309", "name": "Công Ty TNHH Accor Advantage Plus Việt Nam", "mst": "0102279583", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000310", "code": "VD0000310", "name": "Công Ty TNHH Bình Hạnh Đan", "mst": "0100511375", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
{"id": "v-VD0000311", "code": "VD0000311", "name": "Công Ty TNHH Dịch vụ Vận Tải Hà Lâm", "mst": "0311938007", "status": "Active", "relationship": "Spend_Authorized", "vendor_contact": [], "docs": [], "contacts": []},
  {
    "id": "v-TEST-LINHP",
    "code": "TEST001",
    "tax_code": "9999999999",
    "parent_tax_code": null,
    "name": "[TEST] Công Ty TNHH Kiểm Tra Email",
    "vista_push_name": "TEST Cong Ty TNHH Kiem Tra Email",
    "cat": "Advertising & POSM",
    "cat_other": null,
    "type": "Service",
    "vpg": "GENERAL",
    "gbp": "DOMESTIC",
    "vbp": "VAT10",
    "pt": "NET30",
    "cur": "VND",
    "addr": "Hồ Chí Minh, Việt Nam",
    "legal_rep": "Linh P",
    "designation": "Giám đốc",
    "ref_customers": "Galaxy Studio",
    "business_reg_no": "0999999999",
    "reg_first_date": "2024-01-01",
    "reg_history": [],
    "headcount": 5,
    "products_services": "Dịch vụ test email thông báo",
    "sub_suppliers": "",
    "charter_capital": 1000000000,
    "website": "",
    "map_url": "",
    "ytd_purchase": 0,
    "bank_account_no": "",
    "bank_name": "",
    "bank_branch": "",
    "bank_account_holder": "",
    "acc_confirmed": false,
    "acc_confirmed_by": null,
    "acc_confirmed_at": null,
    "mst_status": null,
    "mst_status_note": null,
    "mst_status_at": null,
    "sa_done": false,
    "sa_no": "",
    "sa_date": null,
    "sa_score": null,
    "sa_rating": "",
    "sa_purpose": "",
    "te_done": true,
    "te_no": "TE-TEST-001",
    "contract_type": "HĐNT",
    "status": "Active",
    "submitted_by": "sonbn@galaxystudio.vn",
    "approved_by": "sonbn@galaxystudio.vn",
    "segment": "Approved",
    "relationship": "Spend_Authorized",
    "created_at": "2026-08-11T00:00:00Z",
    "updated_at": "2026-08-11T00:00:00Z",
    "vendor_contact": [
      {
        "id": "c-TEST-LINHP",
        "vendor_id": "v-TEST-LINHP",
        "ctype": "PIC",
        "name": "Linh P",
        "email": "linhp7448@gmail.com",
        "phone": "0901234567"
      }
    ],
    "vendor_alias": [],
    "vendor_document": [
      {
        "id": "doc-test-linhp-001",
        "vendor_id": "v-TEST-LINHP",
        "doc_type": "Hợp đồng nguyên tắc",
        "file_name": "HĐNT Test Email (Hết hạn 2026-09-10)",
        "storage_path": null,
        "valid_to": "2026-09-10",
        "uploaded_at": "2026-08-11T00:00:00Z"
      },
      {
        "id": "doc-test-linhp-002",
        "vendor_id": "v-TEST-LINHP",
        "doc_type": "Giấy phép KD",
        "file_name": "GPKD Test Email (Hết hạn 2026-08-25)",
        "storage_path": null,
        "valid_to": "2026-08-25",
        "uploaded_at": "2026-08-11T00:00:00Z"
      }
    ]
  }
];

const _riskMsts = [
  '3500103104','0314205128','3500101989','0303154993','0305268530','3500877517','0303422716','0302450982',
  '3700335511','3502284181','0302760575','3700217123','0304967631','3500101812','3702613027','0305020360',
  '0309788770','3500102799','3500678039','3500541884','0301851413','3702689499','3700257990','0304988247'
];

const _appRoles = [
  {id:'r001',email:'sonbn@galaxystudio.vn',role:'Admin'},
  {id:'r002',email:'admin@galaxy.vn',role:'Admin'},
  {id:'r003',email:'buyer@galaxy.vn',role:'Buyer'},
  {id:'r004',email:'manager@galaxy.vn',role:'Approver'}
];

const _purchaseOrders = [];

function createQueryBuilder(table) {
  const qb = {
    _table: table, _filters: [], _order: null, _limit: null, _selects: '*',
    _operation: 'select', _payload: null, _conflict: null,

    select(cols) { this._selects = cols; return this; },
    eq(col, val) { this._filters.push({t:'eq', col, val}); return this; },
    neq(col, val) { this._filters.push({t:'neq', col, val}); return this; },
    in(col, vals) { this._filters.push({t:'in', col, vals}); return this; },
    gte(col, val) { this._filters.push({t:'gte', col, val}); return this; },
    lte(col, val) { this._filters.push({t:'lte', col, val}); return this; },
    is(col, val) { this._filters.push({t:'is', col, val}); return this; },
    order(col, opts) { this._order = {col, asc: opts?.ascending !== false}; return this; },
    limit(n) { this._limit = n; return this; },
    
    insert(data) { this._operation='insert'; this._payload=data; return this; },
    update(data) { this._operation='update'; this._payload=data; return this; },
    upsert(data, opts) { this._operation='upsert'; this._payload=data; this._conflict=opts?.onConflict; return this; },
    delete() { this._operation='delete'; return this; },

    async single() {
      const r = await this._run();
      return { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: null };
    },
    async maybeSingle() {
      const r = await this._run();
      return { data: Array.isArray(r.data) ? (r.data[0] || null) : r.data, error: null };
    },

    _getTable() {
      const tables = {
        vendor: _vendors,
        tax_risk_registry: _riskMsts.map(m => ({mst:m})),
        app_role: _appRoles,
        app_setting: [],
        app_supplier: [],
        purchase_order: _purchaseOrders,
        po_line: [],
        po_delivery: [],
        vendor_contact: _vendors.flatMap(v=>v.vendor_contact||[]),
        vendor_alias: _vendors.flatMap(v=>v.vendor_alias||[]),
        vendor_document: _vendors.flatMap(v=>v.vendor_document||[]),
        item_master: [],
        rfi: [], rfq: [], rfq_invite: [], rfq_line: [], rfq_quote_line: [],
        delivery_location: [],
        promo: [],
        compliance_requirement: [],
        vendor_compliance: [],
        audit_log: [],
        inactive_request: [],
        item_category: [],
        app_config: [],
      };
      return tables[this._table] || [];
    },

    _applyFilters(rows) {
      return rows.filter(row => {
        return this._filters.every(f => {
          const v = row[f.col];
          if(f.t==='eq') return v == f.val || (v===null && f.val===null);
          if(f.t==='neq') return v != f.val;
          if(f.t==='in') return f.vals.includes(v);
          if(f.t==='gte') return v >= f.val;
          if(f.t==='lte') return v <= f.val;
          if(f.t==='is') return f.val===null ? v===null : v===f.val;
          return true;
        });
      });
    },

    _run() {
      return new Promise(resolve => {
        setTimeout(() => {
          try {
            if(this._operation === 'select') {
              let rows = this._getTable().slice();
              rows = this._applyFilters(rows);
              if(this._order) {
                rows.sort((a,b) => {
                  const av = a[this._order.col] ?? '', bv = b[this._order.col] ?? '';
                  const dir = this._order.asc ? 1 : -1;
                  if(av < bv) return -1*dir;
                  if(av > bv) return 1*dir;
                  return 0;
                });
              }
              if(this._limit) rows = rows.slice(0, this._limit);
              resolve({ data: rows, error: null });
            } else if(this._operation === 'insert') {
              const arr = Array.isArray(this._payload) ? this._payload : [this._payload];
              const inserted = arr.map(item => ({
                id: 'mock-' + Date.now() + '-' + Math.random().toString(36).slice(2),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...item
              }));
              const tbl = this._getTable();
              inserted.forEach(r => {
                tbl.push(r);
                if(this._table === 'vendor_contact') {
                  let v = _vendors.find(x => x.id === r.vendor_id);
                  if(v) { v.vendor_contact = v.vendor_contact || []; v.vendor_contact.push(r); }
                }
                if(this._table === 'vendor_document') {
                  let v = _vendors.find(x => x.id === r.vendor_id);
                  if(v) { v.vendor_document = v.vendor_document || []; v.vendor_document.push(r); }
                }
              });
              resolve({ data: inserted[0] || null, error: null });
            } else if(this._operation === 'update') {
              let rows = this._getTable();
              let updated = [];
              rows.forEach((row, i) => {
                const match = this._filters.every(f => {
                  const v = row[f.col];
                  if(f.t==='eq') return v == f.val;
                  if(f.t==='in') return f.vals.includes(v);
                  return true;
                });
                if(match) {
                  Object.assign(row, this._payload, {updated_at: new Date().toISOString()});
                  updated.push(row);
                }
              });
              resolve({ data: updated, error: null });
            } else if(this._operation === 'delete') {
              const tbl = this._getTable();
              const toRemove = this._applyFilters(tbl);
              toRemove.forEach(r => {
                const idx = tbl.indexOf(r);
                if(idx >= 0) tbl.splice(idx, 1);
                if(this._table === 'vendor_contact') {
                  let v = _vendors.find(x => x.id === r.vendor_id);
                  if(v && v.vendor_contact) {
                    let cIdx = v.vendor_contact.findIndex(c => c.id === r.id);
                    if(cIdx >= 0) v.vendor_contact.splice(cIdx, 1);
                  }
                }
                if(this._table === 'vendor_document') {
                  let v = _vendors.find(x => x.id === r.vendor_id);
                  if(v && v.vendor_document) {
                    let dIdx = v.vendor_document.findIndex(d => d.id === r.id);
                    if(dIdx >= 0) v.vendor_document.splice(dIdx, 1);
                  }
                }
              });
              resolve({ data: null, error: null });
            } else if(this._operation === 'upsert') {
              resolve({ data: this._payload, error: null });
            } else {
              resolve({ data: null, error: null });
            }
          } catch(e) {
            resolve({ data: null, error: { message: e.message } });
          }
        }, 30);
      });
    },

    then(res, rej) { return this._run().then(res, rej); }
  };
  return qb;
}

function createMockClient() {
  return {
    auth: {
      getSession() {
        return Promise.resolve({ data: { session: _session }, error: null });
      },
      onAuthStateChange(cb) {
        _authCbs.push(cb);
        if(_session) setTimeout(() => cb('SIGNED_IN', _session), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword({ email, password }) {
        return new Promise(resolve => {
          setTimeout(() => {
            if(!email || password.length < 3) {
              resolve({ data: null, error: { message: 'Sai email hoặc mật khẩu' } });
              return;
            }
            const user = { id: 'demo-user-001', email, aud: 'authenticated', role: 'authenticated' };
            _session = { user, access_token: 'demo-token-' + Date.now() };
            _authCbs.forEach(cb => cb('SIGNED_IN', _session));
            resolve({ data: { user, session: _session }, error: null });
          }, 400);
        });
      },
      signOut() {
        _session = null;
        _authCbs.forEach(cb => cb('SIGNED_OUT', null));
        return Promise.resolve({ error: null });
      },
      getUser(token) {
        if(_session) return Promise.resolve({ data: { user: _session.user }, error: null });
        return Promise.resolve({ data: { user: null }, error: null });
      },
      admin: {
        listUsers() { return Promise.resolve({ data: { users: _USERS }, error: null }); },
        createUser({ email, password }) {
          const u = { id: 'u-' + Date.now(), email, created_at: new Date().toISOString() };
          _USERS.push(u);
          return Promise.resolve({ data: { user: u }, error: null });
        },
        updateUserById(id, { password }) { return Promise.resolve({ error: null }); },
        deleteUser(id) {
          const i = _USERS.findIndex(u => u.id === id);
          if(i >= 0) _USERS.splice(i, 1);
          return Promise.resolve({ error: null });
        }
      }
    },
    from(table) { return createQueryBuilder(table); },
    rpc(fn, args) { return Promise.resolve({ data: null, error: null }); },
    functions: { invoke() { return Promise.resolve({ data: null, error: null }); } },
    storage: {
      from(bucket) {
        return {
          upload(path, file) { return Promise.resolve({ data: { path }, error: null }); },
          createSignedUrl(path, exp) { return Promise.resolve({ data: { signedUrl: null }, error: null }); },
          getPublicUrl(path) { return { data: { publicUrl: null } }; },
          remove(paths) { return Promise.resolve({ data: null, error: null }); }
        };
      }
    },
    channel(name) { return { on() { return this; }, subscribe() { return this; }, unsubscribe() {} }; },
    removeChannel() {}
  };
}

window.supabase = { createClient: () => createMockClient() };

})();
