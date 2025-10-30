Voucher (Phiếu giảm giá/Khuyến mãi)

Chức năng chính của mục Voucher là quản lý các chương trình khuyến mãi (mã giảm giá, ưu đãi). Hệ thống cho phép tạo và lưu trữ các voucher với đa dạng loại giảm giá (theo % hoặc số tiền cố định, tặng kèm sản phẩm). Các điều kiện áp dụng (mặt hàng, số lượng, nhóm khách hàng, thời hạn) được thiết lập linh hoạt. Khi thanh toán, phần mềm tự động áp dụng ưu đãi đã kích hoạt, đảm bảo khách hàng được giảm đúng giá và tránh sai sót thủ công. Ví dụ, cho phép thiết lập nhiều chiến dịch khuyến mãi (dịp lễ, khách hàng thân thiết, mua 1 tặng 1…) theo thời hạn xác định

Mục chính	Mục phụ	Chức năng chính (mục đích, gợi ý UI)
Voucher	Danh sách Voucher	Liệt kê tất cả mã giảm giá đã tạo dưới dạng bảng (cột: Mã voucher, mô tả, loại giảm, giá trị giảm, hạn dùng, tình trạng…). Cho phép tìm/lọc và kích hoạt/hủy voucher. Giao diện: bảng dữ liệu giống Admin Dashboard, có nút chỉnh sửa/xóa mỗi voucher.
	Tạo voucher	Form nhập liệu tạo mã giảm giá mới: mã, mô tả, tỷ lệ/số tiền giảm, điều kiện áp dụng (sản phẩm, nhóm khách), thời gian hiệu lực, số lượng lượt sử dụng… Cung cấp tính năng lưu dưới dạng chiến dịch. Giao diện: form trực quan, có thanh chọn ngày (date-picker), công tắc bật/tắt trạng thái voucher.
	Chiến dịch khuyến mãi	Nhóm nhiều voucher liên quan thành một chiến dịch (ví dụ: chương trình Giáng sinh, mua hè…). Cho phép theo dõi tổng quan hiệu quả mỗi chiến dịch (số voucher đã sử dụng, doanh thu tăng thêm). Giao diện: biểu đồ/ báo cáo sơ bộ trên dashboard chiến dịch.

Giao diện (UI): Có thể sử dụng bảng danh sách (DataTable) cho các voucher, với thanh tìm kiếm/ lọc (theo mã, thời hạn, trạng thái). Form tạo voucher nên đơn giản, sử dụng điều khiển hiện đại (date-picker, dropdown). Màu sắc/trạng thái voucher (đang kích hoạt, đã hết hạn) được hiển thị rõ ràng. Theo [17], phần mềm quản lý nhà thuốc nên tự động hóa quy trình áp dụng khuyến mãi để “đảm bảo khách hàng được giảm đúng giá”
 và cho phép “quản lý nhiều chiến dịch giảm giá” khác nhau


Báo cáo (Report)

Mục Báo cáo tổng hợp các báo cáo kinh doanh và tài chính cho nhà thuốc. Đề xuất chia thành các nhóm báo cáo chính để rõ ràng:

Báo cáo bán hàng: Tổng hợp doanh thu theo ngày/tuần/tháng, sản phẩm bán chạy, doanh thu theo nhóm khách hàng. Tích hợp biểu đồ (cột, đường) và thống kê tổng. Hỗ trợ lọc theo thời gian, mặt hàng.

Báo cáo mua hàng: Danh sách đơn hàng nhập từ nhà cung cấp, tổng chi phí mua theo khoảng thời gian, trạng thái đơn hàng.

Báo cáo tồn kho: Tồn kho hiện tại, danh sách thuốc sắp hết hạn hoặc hết hàng, cảnh báo tồn thấp.

Báo cáo tài chính: Báo cáo lợi nhuận (doanh thu trừ chi phí), chi phí vận hành (tiền lương, điện nước…), báo cáo thuế. Hỗ trợ tổng hợp theo tháng/quý.

Báo cáo khác (tuỳ chọn): Báo cáo công nợ, báo cáo theo khách hàng, hiệu suất nhân viên, v.v., nếu cần gộp.

Mục chính	Mục phụ	Chức năng chính (mục đích, gợi ý UI)
Report	Báo cáo bán hàng	Tổng hợp doanh thu theo thời gian (ngày/tuần/tháng), doanh số từng sản phẩm/nhóm sản phẩm, biểu đồ xu hướng doanh thu. Cho phép xuất PDF/Excel. Hệ thống các báo cáo chi tiết để giám sát hiệu suất bán hàng. Theo [31], một PMS tốt nên “cung cấp thông tin về xu hướng doanh thu” để hỗ trợ quyết định

	Báo cáo nhập hàng	Theo dõi đơn hàng nhập thuốc (số lượng, chi phí), báo cáo chi tiết nhà cung cấp, công nợ phải trả. Cảnh báo hóa đơn cần thanh toán. Hữu ích để kiểm soát dòng tiền và tồn kho.
	Báo cáo kho	Báo cáo tồn kho hiện tại theo mặt hàng, số liệu thuốc hết hạn/sắp hết hạn. Cảnh báo tồn kho ở mức tối thiểu. Giao diện: bảng dữ liệu + biểu đồ tròn/đường giúp theo dõi nhanh.
	Báo cáo tài chính	Báo cáo lợi nhuận (doanh thu – chi phí), chi phí chi tiết (nhân sự, điện nước, thuê mặt bằng…). Báo cáo thuế GTGT, báo cáo quỹ tiền mặt. Hỗ trợ tổng hợp linh hoạt theo kỳ, xuất file.
	Báo cáo nâng cao	Báo cáo khách hàng (top khách hàng mua nhiều), báo cáo mua hàng của từng nhân viên, báo cáo hiệu suất khuyến mãi, v.v. Có thể gộp vào mục “Khác” hoặc “Tổng hợp” nếu cần.

Giao diện (UI): Mỗi báo cáo nên có bộ lọc ngày/thời gian (date-picker) và tùy chọn hiển thị (bảng số liệu, biểu đồ). Sử dụng Dashboard hiện đại: biểu đồ động, KPI (thẻ số liệu) và khả năng xuất báo cáo. Theo [29] và [31], chức năng phân tích dữ liệu (“Reporting and Analytics”) rất quan trọng trong phần mềm quản lý thuốc giúp cung cấp “báo cáo doanh thu và lợi nhuận chi tiết” và “dữ liệu doanh số” để ra quyết định.

Nhân sự (Human Resource)

Mục Human Resource tập trung quản lý nhân sự tại nhà thuốc. Cần bao gồm các chức năng:

Nhân viên: Quản lý hồ sơ nhân viên (tên, chức vụ, ngày vào làm, lương cơ bản, nhóm (dược sĩ, trợ lý, kinh doanh…), thông tin liên lạc). Lưu trữ hợp đồng lao động và các giấy tờ liên quan.

Chấm công / Lịch làm việc: Ghi nhận thời gian vào/ra của nhân viên (check-in/out), theo dõi giờ làm thêm và nghỉ phép. Hỗ trợ lập bảng chấm công tự động. Theo [35], phần mềm HR chuyên cho hiệu thuốc sẽ “tự động hóa chấm công và bảng lương” và theo dõi “attendance, absences” của nhân viên


Bảng lương: Tính lương tự động theo lương cơ bản, phụ cấp, làm thêm giờ, thuế TNCN, bảo hiểm. Xuất phiếu lương cho nhân viên. Có thể tính thưởng, tạm ứng và khấu trừ bảo hiểm theo quy định.

Chi phí nhân sự: Quản lý các chi phí liên quan đến nhân sự (bảo hiểm, khen thưởng, đào tạo, phúc lợi). Báo cáo tổng chi phí lương tháng/quý để đối chiếu.

Hồ sơ và đào tạo (tùy chọn): Lưu trữ chứng chỉ chuyên môn, lịch đào tạo nhân viên, đánh giá năng lực. Gửi thông báo tự động cho nhân viên về lịch đào tạo hoặc tái chứng chỉ.

Mục chính	Mục phụ	Chức năng chính (mục đích, gợi ý UI)
Human Resource	Nhân viên	Quản lý danh sách nhân viên (bảng dữ liệu: tên, chức vụ, phòng ban, lương, ngày vào làm, liên hệ). Cho phép thêm/sửa/xóa hồ sơ, tải lên tài liệu (hợp đồng, chứng chỉ).
	Chấm công / Lịch ca	Ghi nhận và theo dõi công: nhập thời gian làm việc (check-in/out) hoặc lịch trực ca. Hỗ trợ tạo bảng công tự động. Theo dõi phép năm, nghỉ ốm. Giao diện: lịch biểu (calendar) và bảng chấm công.
	Bảng lương	Tính lương theo dữ liệu chấm công và hệ số lương, phụ cấp. Cho phép xuất bảng lương và phiếu lương PDF. Tích hợp tính thuế TNCN, BHXH. Giao diện: form tính lương + bảng dữ liệu kết quả.
	Phúc lợi/Chi phí	Quản lý các khoản chi phí nhân sự (bảo hiểm xã hội, y tế; thưởng lễ tết; tạm ứng). Báo cáo tổng hợp chi phí lương và phúc lợi theo tháng/quý.
	Hồ sơ/Đào tạo	Lưu trữ hợp đồng, đánh giá, chứng chỉ đào tạo. Lên kế hoạch đào tạo nội bộ (ví dụ tập huấn dược). Theo dõi hoàn thành khóa học. (Tùy chọn nhưng tăng tính chuyên nghiệp cho nhà thuốc.)

Giao diện (UI): Sử dụng bảng dữ liệu Admin hiện đại cho danh sách nhân viên, form pop-up hoặc trang riêng để nhập thông tin chi tiết. Tính năng tính lương và chấm công nên tự động hóa cao – ví dụ, tự động tính công và lương qua dữ liệu vào/ra, như nhiều hệ thống HR đã thực hiện “tự động hóa chấm công, bảng lương. Bên cạnh đó, phần mềm theo dõi hiệu suất nhân viên, báo cáo nhân sự cũng cần trực quan hóa (biểu đồ cơ cấu nhân sự, tỷ lệ nghỉ). Theo [35], hệ thống HR cho hiệu thuốc nên “theo dõi sự có mặt và vắng mặt” để quản lý hiệu quả đội ngũ


Dịch vụ khám bệnh (Service)

Mục Service mở rộng tính năng tích hợp khám bệnh cho hiệu thuốc, bao gồm: quản lý lịch khám, bác sĩ, bệnh nhân và hồ sơ bệnh án, chăm sóc sau khám. Cụ thể:

Bác sĩ: Quản lý thông tin bác sĩ (tên, chuyên khoa, lịch trực, liên hệ). Xem lịch làm việc của bác sĩ trên giao diện lịch (calendar). Cho phép thiết lập ca làm việc và phân công lịch trực.

Bệnh nhân: Lưu hồ sơ bệnh nhân: thông tin cá nhân, tiền sử bệnh, đơn thuốc đã kê trước đó. Cho phép tìm kiếm và cập nhật tình trạng sức khỏe. Theo [31], phần mềm nên “tập trung hóa dữ liệu bệnh nhân” để hỗ trợ chăm sóc cá nhân hóa

Lịch khám (đặt lịch): Quản lý lịch hẹn khám bệnh của phòng khám tại nhà thuốc. Cho phép nhân viên y tế hoặc bệnh nhân đặt lịch trực tuyến/offline, xem lịch khám theo ngày/tuần. Giao diện: Calendar hiện đại, có màu phân biệt bác sĩ hoặc tình trạng hẹn. Có thông báo nhắc lịch cho bệnh nhân và bác sĩ.

Hồ sơ bệnh án: Lưu trữ kết quả khám, chẩn đoán, đơn thuốc và kế hoạch điều trị của bệnh nhân sau mỗi lần khám. Cho phép tải lên kết quả xét nghiệm, ảnh phim nếu có. Giao diện: trang cá nhân bệnh án theo bệnh nhân với lịch sử khám.

Chăm sóc hậu khám: Các công cụ nhắc tái khám (reminder), tư vấn sau khám (ví dụ, nhắc dùng thuốc, hẹn xét nghiệm). Theo dõi kết quả điều trị, ghi nhận phản hồi của bệnh nhân. (Ví dụ: tự động nhắn tin thông báo tái khám).

Mục chính	Mục phụ	Chức năng chính (mục đích, gợi ý UI)
Service	Bác sĩ	Quản lý danh sách bác sĩ: tên, chuyên khoa, thời gian làm việc. Giao diện: bảng danh sách hoặc profile bác sĩ, tích hợp lịch cá nhân hiển thị ca trực của từng bác sĩ.
	Bệnh nhân	Quản lý hồ sơ bệnh nhân: thông tin cá nhân, tiền sử bệnh, dị ứng, đơn thuốc đã dùng. Cho phép tìm kiếm bệnh nhân. Giao diện: trang thông tin bệnh nhân (forms + lịch sử điều trị).
	Lịch khám	Quản lý đặt lịch khám (lịch hẹn): hiển thị dưới dạng lịch calendar theo bác sĩ hoặc phòng khám. Cho phép thêm/sửa lịch hẹn (thời gian, ngày). Hệ thống nhắc nhở qua email/SMS.
	Hồ sơ bệnh án	Lưu hồ sơ y tế từng lần khám: triệu chứng, chuẩn đoán, kết quả xét nghiệm, đơn thuốc. Cho phép in đơn thuốc. Giao diện: form nhập liệu khám bệnh, xem lại qua lịch sử.
	Hậu khám (tái khám)	Theo dõi và nhắc lịch tái khám, đánh giá hiệu quả điều trị. Ví dụ: ghi nhận phản hồi sức khỏe, thông báo uống thuốc đầy đủ. (Tùy chọn nhưng nâng cao chất lượng dịch vụ.)