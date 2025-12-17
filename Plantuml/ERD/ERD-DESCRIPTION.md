# Entity Relationship Diagram (ERD) - Hệ thống Quản lý Nhà thuốc Pharmacare

## Mục lục
1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Các nhóm Entity](#các-nhóm-entity)
3. [Chi tiết từng Entity](#chi-tiết-từng-entity)
4. [Relationships & Luồng Dữ liệu](#relationships--luồng-dữ-liệu)
5. [Ví dụ thực tế](#ví-dụ-thực-tế)

---

## Tổng quan hệ thống

Hệ thống Pharmacare là một nền tảng quản lý toàn diện cho nhà thuốc bán lẻ, bao gồm các chức năng chính:

- **Quản lý Kho hàng**: Nhập kho, quản lý lô hàng, hạn sử dụng, cảnh báo tồn kho
- **Bán hàng POS**: Tạo hóa đơn, thanh toán, quản lý khách hàng, áp dụng voucher
- **Quản lý Nhân sự**: Chấm công, tính lương, thưởng/phạt, quản lý ca làm việc
- **Khuyến mãi & Voucher**: Tạo mã giảm giá, theo dõi lượt sử dụng
- **Trả hàng & Hoàn kho**: Xử lý trả hàng của khách, cập nhật tồn kho

ERD gồm **4 nhóm chính** được phân biệt bằng màu sắc:
- 🟢 **Master Data (Xanh lá)**: Dữ liệu nền tảng
- 🔵 **Product & Stock (Xanh dương)**: Quản lý hàng hóa & tồn kho
- 🟠 **Sales (Cam)**: Bán hàng & khách hàng
- 🟣 **HR (Tím)**: Quản lý nhân sự

---

## Các nhóm Entity

### 1. Master Data (Xanh lá)

Nhóm này chứa các dữ liệu tham chiếu được sử dụng bởi các entity khác:

#### **Categories** (Danh mục thuốc)
- **Mục đích**: Phân loại thuốc theo loại (ví dụ: Kháng sinh, Vitamin, Dị ứng, v.v)
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `name`: String - Tên danh mục (unique)
  - `description`: String - Mô tả danh mục
  - `status`: Boolean - Trạng thái hoạt động
- **Quan hệ**: `Categories (1) -- Many (Medicines)` - Một danh mục chứa nhiều thuốc

#### **Units** (Đơn vị tính)
- **Mục đích**: Định nghĩa các đơn vị đo lường (Viên, Vỉ, Hộp, Chai, v.v)
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `name`: String - Tên đơn vị (unique)
  - `status`: Boolean - Trạng thái
- **Ví dụ**: "Tablet" (viên), "Capsule" (viên nang), "Effervescent" (viên sủi)
- **Quan hệ**: `Units (1) -- Many (Medicines)` - Một đơn vị áp dụng cho nhiều thuốc

#### **TypeMedicines** (Loại thuốc)
- **Mục đích**: Phân loại theo tính chất (OTC - không kê đơn, Prescription - kê đơn)
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `name`: String - Tên loại (unique)
  - `status`: Boolean - Trạng thái
- **Ví dụ**: "OTC" (bán tự do), "Prescription" (thuốc kê đơn)
- **Quan hệ**: `TypeMedicines (1) -- Many (Medicines)`

#### **Suppliers** (Nhà cung cấp)
- **Mục đích**: Lưu trữ thông tin các nhà cung cấp thuốc
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `name`: String - Tên công ty cung cấp
  - `phone`: String - Số điện thoại liên hệ
  - `email`: String - Email
  - `address`: String - Địa chỉ
  - `city`: String - Thành phố
  - `country`: String - Quốc gia
  - `balance`: Number - Số dư tài khoản (nợ/có)
- **Quan hệ**: `Suppliers (1) -- Many (Purchases)` - Một nhà cung cấp có nhiều phiếu nhập

#### **Banks** (Ngân hàng)
- **Mục đích**: Lưu thông tin tài khoản ngân hàng cho thanh toán lương & hóa đơn
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `bank_name`: String - Tên ngân hàng
  - `account_name`: String - Tên chủ tài khoản
  - `account_number`: String - Số tài khoản
  - `branch`: String - Chi nhánh
  - `qr_image`: String - URL ảnh QR code (nếu có)
  - `status`: Boolean - Trạng thái hoạt động
- **Quan hệ**: `Banks .. Payroll` - Tham chiếu cho thanh toán lương

---

### 2. Product & Stock (Xanh dương)

Nhóm này quản lý hàng hóa, tồn kho, và các giao dịch mua hàng:

#### **Medicines** (Thuốc)
- **Mục đích**: Lưu thông tin chi tiết của từng loại thuốc
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `name`: String - Tên thuốc
  - `bar_code`: String - Mã vạch (unique)
  - `generic`: String - Tên generic/chung (ví dụ: "Paracetamol")
  - `price`: Number - Giá bán lẻ (MRP)
  - `image`: String - URL hình ảnh sản phẩm
  - `strength`: String - Độ mạnh/nồng độ (ví dụ: "500mg")
  - `description`: String - Mô tả chi tiết
  - `unit_id`: ObjectId (FK) - Tham chiếu tới Units
  - `category_id`: ObjectId (FK) - Tham chiếu tới Categories
  - `type_id`: ObjectId (FK) - Tham chiếu tới TypeMedicines
  - `supplier_price`: Number - Giá mua từ nhà cung cấp
  - `prescription_required`: Boolean - Có yêu cầu kê đơn không?
  - `max_quantity_per_day`: Number - Giới hạn mua/ngày
  - `max_quantity_per_month`: Number - Giới hạn mua/tháng

**Ví dụ thực tế**:
```
Medicines:
- name: "Hapacol 500mg"
- bar_code: "8930001001"
- generic: "Paracetamol"
- price: 60000 (VND)
- strength: "500mg"
- unit_id: → Units (Tablet)
- category_id: → Categories (Pain Relief)
- type_id: → TypeMedicines (OTC)
```

- **Quan hệ**:
  - Tham chiếu tới 3 Master Data: Categories, Units, TypeMedicines
  - `Medicines (1) -- Many (Stocks)` - Một loại thuốc có nhiều lô hàng

#### **Stocks** (Tồn kho)
- **Mục đích**: Quản lý chi tiết từng lô hàng (batch) của thuốc, bao gồm batch_id, hạn dùng, số lượng
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `medicine`: ObjectId (FK) - Tham chiếu tới Medicines
  - `batch_id`: String - Mã lô hàng (ví dụ: "LOT202501001")
  - `expiry_date`: Date - Ngày hết hạn
  - `box_pattern`: String - Cấu trúc đóng gói (ví dụ: "10x10" = 1 hộp 10 vỉ, 1 vỉ 10 viên)
  - `box_quantity`: Number - Số hộp hiện có
  - `unit_quantity`: Number - Số viên/đơn vị nhỏ nhất hiện có
  - `purchase_price`: Number - Giá mua khi nhập kho
  - `mrp`: Number - Maximum Retail Price (giá bán lẻ)
  - `vat`: Number - % VAT (nếu có)

**Ví dụ thực tế**:
```
Stocks (Hapacol 500mg):
- batch_id: "8930001001"
- expiry_date: "2026-05-15"
- box_pattern: "10x10" (1 hộp = 10 vỉ, 1 vỉ = 10 viên)
- box_quantity: 50 (50 hộp)
- unit_quantity: 5000 (50 x 10 x 10)
- purchase_price: 40000/hộp
- mrp: 60000/viên
```

- **Quan hệ**: 
  - `Stocks .. PurchaseItems` - Khi nhập kho, dữ liệu từ PurchaseItems được sử dụng để tạo/cập nhật Stocks
  - `InvoiceItems .. Stocks` - Khi bán, số lượng trong Stocks giảm

#### **Purchases** (Phiếu nhập kho)
- **Mục đích**: Ghi lại các lần nhập hàng từ nhà cung cấp
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `supplier`: ObjectId (FK) - Tham chiếu tới Suppliers
  - `invoice_no`: String - Số hóa đơn từ nhà cung cấp
  - `date`: Date - Ngày nhập kho
  - `payment_type`: String - Kiểu thanh toán (cash, bank, credit)
  - `total`: Number - Tổng tiền nhập
  - `paid`: Number - Số tiền đã thanh toán
  - `due`: Number - Số tiền còn nợ

**Ví dụ thực tế**:
```
Purchase:
- supplier: → Suppliers (Sunrise Pharma)
- invoice_no: "SPH-2025-001"
- date: "2025-01-20"
- payment_type: "bank"
- total: 175,600,000 VND
```

- **Quan hệ**: `Purchases (1) -- Many (PurchaseItems)`

#### **PurchaseItems** (Chi tiết phiếu nhập - Embedded)
- **Mục đích**: Danh sách từng loại thuốc trong phiếu nhập
- **Trường chính**:
  - `medicine`: ObjectId (FK) - Tham chiếu tới Medicines
  - `batch_id`: String - Mã lô hàng
  - `expiry_date`: Date - Hạn dùng
  - `box_pattern`: String - Cấu trúc đóng gói
  - `box_quantity`: Number - Số hộp
  - `unit_quantity`: Number - Tổng số đơn vị nhỏ nhất
  - `supplier_price`: Number - Giá mua từ supplier
  - `mrp`: Number - Giá bán lẻ được đặt
  - `vat`: Number - % VAT

**Lưu ý**: PurchaseItems là **Embedded Document**, nghĩa là được lưu trực tiếp bên trong document Purchases (không phải collection riêng biệt)

- **Quan hệ**: `PurchaseItems .. Stocks` - Khi phiếu nhập được confirm, hệ thống tạo/update record trong Stocks

---

### 3. Sales & Customer (Cam)

Nhóm này quản lý bán hàng, khách hàng, voucher và trả hàng:

#### **Customers** (Khách hàng)
- **Mục đích**: Lưu thông tin chi tiết khách hàng
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `customer_id`: String - Mã khách hàng (ví dụ: "KH001")
  - `full_name`: String - Họ tên
  - `phone`: String - Số điện thoại (indexed)
  - `email`: String - Email
  - `address`: String - Địa chỉ
  - `medical_profile`: Object - Hồ sơ y tế:
    - `chronic_conditions`: Array - Các bệnh mãn tính
    - `allergies`: Array - Dị ứng
    - `current_medications`: Array - Thuốc đang dùng
  - `purchase_history`: Array - Lịch sử mua hàng
  - `notes`: String - Ghi chú

**Ví dụ thực tế**:
```
Customer:
- customer_id: "KH523490"
- full_name: "Nguyễn Văn A"
- phone: "0917519364"
- medical_profile:
  - chronic_conditions: ["Tiểu đường"]
  - allergies: ["Penicillin"]
  - current_medications: ["Metformin"]
```

- **Quan hệ**: 
  - `Customers (1) -- Many (Invoices)` - Một khách hàng có nhiều hóa đơn
  - `Customers (1) -- Many (CustomerReturns)` - Một khách hàng có nhiều lần trả hàng

#### **Invoices** (Hóa đơn bán)
- **Mục đích**: Ghi lại các giao dịch bán hàng
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `invoice_no`: String - Số hóa đơn (ví dụ: "HD001-2025")
  - `date`: Date - Ngày tạo hóa đơn
  - `customer`: ObjectId (FK) - Tham chiếu tới Customers (optional - có thể là bán vãng lai)
  - `voucher`: ObjectId (FK) - Tham chiếu tới Vouchers (nếu có áp dụng)
  - `subtotal`: Number - Tổng tiền hàng (trước thuế & giảm giá)
  - `vat_total`: Number - Tổng tiền VAT
  - `discount`: Number - Tiền giảm giá (không phải voucher)
  - `voucher_discount`: Number - Tiền giảm từ voucher
  - `grand_total`: Number - Tổng tiền phải trả
  - `paid`: Number - Số tiền đã thanh toán
  - `due`: Number - Số tiền còn nợ (0 nếu đã trả hết)
  - `payment_method`: String - Phương thức thanh toán (cash, card, bank_transfer, etc)
  - `payment_status`: String - Trạng thái thanh toán (pending, completed, partial, etc)
  - `is_pos`: Boolean - Có phải giao dịch POS không?
  - `created_by`: ObjectId (FK) - Tham chiếu tới Employee (nhân viên tạo)

**Ví dụ thực tế**:
```
Invoice:
- invoice_no: "HD001-20250120"
- customer: → Customers (KH523490)
- date: "2025-01-20 14:30:00"
- items: [InvoiceItem 1, InvoiceItem 2, ...]
- subtotal: 300,000
- discount: 30,000 (giảm giá thêm)
- voucher: → Vouchers (WELCOME10)
- voucher_discount: 20,000
- vat_total: 12,900
- grand_total: 262,900
- paid: 262,900
- payment_method: "card"
- created_by: → Employee (Nhân viên bán)
```

- **Quan hệ**: `Invoices (1) -- Many (InvoiceItems)`

#### **InvoiceItems** (Chi tiết hóa đơn - Embedded)
- **Mục đích**: Danh sách từng loại thuốc được bán trong hóa đơn
- **Trường chính**:
  - `medicine`: ObjectId (FK) - Tham chiếu tới Medicines
  - `medicine_name`: String - Tên thuốc (snapshot tại thời điểm bán)
  - `batch_id`: String - Mã lô hàng được bán
  - `expiry_date`: Date - Hạn dùng
  - `quantity`: Number - Số lượng bán
  - `price`: Number - Giá bán (snapshot)
  - `vat`: Number - % VAT
  - `subtotal`: Number - Thành tiền (quantity × price)

**Lưu ý quan trọng**: Các trường như `medicine_name` và `price` là **snapshot** - tức là giữ nguyên giá trị tại thời điểm bán, không thay đổi ngay cả khi Medicines record bị cập nhật. Điều này đảm bảo tính chính xác lịch sử giao dịch.

**Ví dụ thực tế**:
```
InvoiceItems:
[
  {
    medicine: → Medicines (Hapacol)
    medicine_name: "Hapacol 500mg" (snapshot)
    batch_id: "8930001001"
    quantity: 10
    price: 60,000 (snapshot - tức là giá bán hôm đó)
    vat: 10
    subtotal: 600,000
  },
  {
    medicine: → Medicines (Brufen)
    medicine_name: "Brufen 400mg" (snapshot)
    batch_id: "8930001004"
    quantity: 5
    price: 30,000 (snapshot)
    vat: 10
    subtotal: 150,000
  }
]
```

- **Quan hệ**: 
  - `InvoiceItems .. Medicines` - Tham chiếu thông tin thuốc
  - `InvoiceItems .. Stocks` - Trừ số lượng từ tồn kho dựa trên batch_id

#### **Vouchers** (Mã giảm giá)
- **Mục đích**: Quản lý các chương trình khuyến mãi
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `voucher_code`: String - Mã voucher (unique, uppercase)
  - `name`: String - Tên chương trình
  - `description`: String - Mô tả chi tiết
  - `discount_type`: String - Kiểu giảm giá (percentage, fixed)
  - `discount_value`: Number - Mức giảm (% hoặc số tiền)
  - `min_purchase_amount`: Number - Mua tối thiểu mới được áp dụng
  - `max_discount_amount`: Number - Giảm tối đa (nếu percentage)
  - `usage_limit`: Number - Tổng lần sử dụng tối đa
  - `usage_count`: Number - Số lần đã sử dụng
  - `usage_limit_per_customer`: Number - Mỗi khách hàng sử dụng tối đa bao nhiêu lần
  - `max_users`: Number - Tổng khách hàng có thể sử dụng
  - `start_date`: Date - Ngày bắt đầu
  - `end_date`: Date - Ngày kết thúc
  - `applicable_to`: String - Áp dụng cho (all, medicine, category, service)
  - `applicable_items`: Array - Danh sách thuốc/danh mục (nếu restricted)
  - `status`: String - Trạng thái (active, inactive, expired)

**Ví dụ thực tế**:
```
Voucher:
- voucher_code: "WELCOME10"
- name: "Chào mừng khách hàng mới"
- discount_type: "percentage"
- discount_value: 10
- min_purchase_amount: 100,000
- max_discount_amount: 50,000
- usage_limit: 1000
- usage_count: 450 (đã sử dụng)
- usage_limit_per_customer: 1
- start_date: "2025-01-01"
- end_date: "2025-12-31"
- applicable_to: "all"
- status: "active"
```

- **Quan hệ**: 
  - `Vouchers (1) -- Many (Invoices)` - Một voucher có thể áp dụng trên nhiều hóa đơn
  - `Vouchers (1) -- Many (VoucherUsages)` - Một voucher có lịch sử sử dụng

#### **CustomerReturns** (Trả hàng)
- **Mục đích**: Quản lý các trường hợp khách hàng trả hàng
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `returnNumber`: String - Số phiếu trả hàng (unique)
  - `invoice`: ObjectId (FK) - Tham chiếu tới Invoice được trả
  - `customer`: ObjectId (FK) - Tham chiếu tới Customers
  - `returnDate`: Date - Ngày trả hàng
  - `totalAmount`: Number - Tổng tiền hoàn lại
  - `reason`: String - Lý do trả (hỏng, hạn dùng gần, sai đơn, etc)
  - `status`: String - Trạng thái (pending, approved, rejected, completed)

**Ví dụ thực tế**:
```
CustomerReturn:
- returnNumber: "TR001-20250120"
- invoice: → Invoices (HD001-20250120)
- customer: → Customers (KH523490)
- returnDate: "2025-01-20"
- reason: "Thuốc hết hạn"
- status: "approved"
```

- **Quan hệ**: `CustomerReturns (1) -- Many (ReturnItems)`

#### **ReturnItems** (Chi tiết trả hàng - Embedded)
- **Mục đích**: Danh sách các loại thuốc được trả
- **Trường chính**:
  - `medicine`: ObjectId (FK)
  - `batchId`: String - Mã lô hàng
  - `quantity`: Number - Số lượng trả
  - `unitPrice`: Number - Giá từng đơn vị
  - `amount`: Number - Thành tiền

- **Quan hệ**: `ReturnItems .. Stocks` - Tăng số lượng kho khi hàng được trả

---

### 4. HR Module (Tím)

Nhóm này quản lý nhân sự, chuyên cần, lương và các khuyến thưởng:

#### **Employees** (Nhân viên)
- **Mục đích**: Quản lý thông tin nhân viên
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `employee_id`: String - Mã nhân viên (unique)
  - `full_name`: String - Họ tên
  - `email`: String - Email (unique)
  - `phone`: String - Số điện thoại
  - `designation`: String - Chức vị (nhân viên bán hàng, thủ kho, etc)
  - `department`: String - Phòng/ban
  - `date_of_birth`: Date - Ngày sinh
  - `date_of_joining`: Date - Ngày vào làm
  - `address`: String - Địa chỉ
  - `city`: String - Thành phố
  - `country`: String - Quốc gia
  - `salary_basic`: Number - Lương cơ bản hàng tháng
  - `bank_account`: String - Số tài khoản ngân hàng
  - `bank_name`: String - Tên ngân hàng
  - `status`: String - Trạng thái (active, inactive, on-leave)

**Ví dụ thực tế**:
```
Employee:
- employee_id: "NV001"
- full_name: "Trần Thị B"
- email: "tran.b@pharmacy.vn"
- phone: "0987654321"
- designation: "Sales Staff"
- department: "Sales"
- salary_basic: 8,000,000
- status: "active"
```

- **Quan hệ**: 
  - `Employees (1) -- Many (Attendance)` - Mỗi nhân viên có nhiều bản ghi chấm công
  - `Employees (1) -- Many (Payroll)` - Mỗi nhân viên có lương mỗi tháng
  - `Employees .. Invoices` - Nhân viên tạo hóa đơn
  - `Employees .. Purchases` - Nhân viên nhập kho

#### **Attendance** (Chấm công)
- **Mục đích**: Ghi lại chi tiết chuyên cần của nhân viên
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `employee`: ObjectId (FK) - Tham chiếu tới Employees
  - `date`: Date - Ngày chấm công
  - `check_in`: Date - Thời gian vào (timestamp)
  - `check_out`: Date - Thời gian ra (timestamp)
  - `status`: String - Trạng thái (present, absent, half-day, leave, holiday)
  - `working_hours`: Number - Số giờ làm việc
  - `overtime_hours`: Number - Số giờ làm thêm
  - `notes`: String - Ghi chú

**Ví dụ thực tế**:
```
Attendance:
- employee: → Employees (NV001)
- date: "2025-01-20"
- check_in: "2025-01-20 08:00:00"
- check_out: "2025-01-20 17:00:00"
- status: "present"
- working_hours: 8
- notes: ""
```

- **Quan hệ**: Được sử dụng để tính toán cho Payroll

#### **Payroll** (Bảng lương)
- **Mục đích**: Tính và ghi lại lương cho từng nhân viên mỗi tháng
- **Trường chính**:
  - `_id`: ObjectId - Khóa chính
  - `employee`: ObjectId (FK) - Tham chiếu tới Employees
  - `month`: Number - Tháng (1-12)
  - `year`: Number - Năm
  - `basic_salary`: Number - Lương cơ bản
  - `benefits`: Array - Danh sách các phúc lợi:
    - `name`: String - Tên phúc lợi
    - `amount`: Number - Số tiền
    - `type`: String - Loại (allowance, bonus, incentive)
  - `deductions`: Array - Danh sách các khoản trừ:
    - `name`: String - Tên khoản trừ
    - `amount`: Number - Số tiền
    - `type`: String - Loại (tax, insurance, loan, other)
  - `working_days`: Number - Tổng ngày làm việc trong tháng
  - `present_days`: Number - Ngày có mặt
  - `overtime_hours`: Number - Giờ làm thêm
  - `overtime_pay`: Number - Tiền làm thêm giờ
  - `gross_salary`: Number - Lương brutto (cơ bản + phúc lợi)
  - `net_salary`: Number - Lương ròng (brutto - khoản trừ)
  - `payment_date`: Date - Ngày thanh toán
  - `payment_method`: String - Phương thức (bank_transfer, cash)
  - `payment_status`: String - Trạng thái (pending, paid, cancelled)

**Ví dụ thực tế**:
```
Payroll:
- employee: → Employees (NV001)
- month: 1
- year: 2025
- basic_salary: 8,000,000
- benefits: [
    {name: "Điểm danh", amount: 500,000},
    {name: "Hoa hồng bán", amount: 1,200,000}
  ]
- deductions: [
    {name: "BHXH", amount: 400,000},
    {name: "Thuế", amount: 300,000}
  ]
- working_days: 22
- present_days: 21
- overtime_hours: 8
- overtime_pay: 400,000
- gross_salary: 9,700,000
- net_salary: 9,000,000
- payment_status: "paid"
```

- **Quan hệ**: `Payroll .. Banks` - Thông tin thanh toán từ Banks

---

## Relationships & Luồng Dữ liệu

### Luồng 1: NHẬP KHO (Purchase Flow)
```
Supplier → Purchases → PurchaseItems → Stocks
```

**Quy trình chi tiết**:
1. Nhân viên kho tạo phiếu **Purchases** từ supplier
2. Thêm các chi tiết vào **PurchaseItems** (danh sách thuốc nhập)
3. Khi confirm phiếu nhập:
   - Hệ thống tạo hoặc cập nhật **Stocks** records
   - Nếu batch chưa tồn tại → tạo mới
   - Nếu batch đã tồn tại → cộng dồn số lượng
4. Cập nhật số dư nợ/có của **Supplier**

**Ví dụ**:
- Nhập 50 hộp Hapacol 500mg (mỗi hộp 100 viên) từ Sunrise Pharma
- Tạo PurchaseItems với: batch_id="LOT202501", quantity=50 hộp=5000 viên
- Stocks được update: unit_quantity += 5000

---

### Luồng 2: BÁN HÀNG (Sales Flow)
```
Customer → Invoices → InvoiceItems → Stocks (trừ)
          ↓
        Vouchers (optional)
```

**Quy trình chi tiết**:
1. Nhân viên bán tạo **Invoices** mới
2. Chọn **Customer** (optional - có thể bán vãng lai)
3. Thêm thuốc vào **InvoiceItems**:
   - Hệ thống gợi ý giá từ Medicines (snapshot)
   - Chọn batch từ Stocks
4. Nếu có **Vouchers** → áp dụng giảm giá
5. Tính tổng tiền (subtotal → VAT → discount → grand_total)
6. Thanh toán:
   - Cập nhật Stocks (trừ số lượng)
   - Ghi lại payment_status trong Invoices
   - Lưu **Customer** purchase_history (nếu có khách hàng)

**Ví dụ**:
```
Invoice HD001:
- Customer: KH523490
- InvoiceItems:
  * Hapacol 500mg (LOT202501): 10 viên @ 60,000 = 600,000
  * Brufen 400mg (LOT202502): 5 viên @ 30,000 = 150,000
- Subtotal: 750,000
- Voucher: WELCOME10 (10%, max 50,000) → 50,000
- VAT: (750,000 - 50,000) × 10% = 70,000
- Grand Total: 770,000
- Stocks: 
  * Hapacol: unit_quantity - 10
  * Brufen: unit_quantity - 5
```

---

### Luồng 3: TRẢ HÀNG (Return Flow)
```
CustomerReturns → ReturnItems → Stocks (cộng)
                ↑
              Invoice
```

**Quy trình chi tiết**:
1. Khách hàng trả hàng → tạo **CustomerReturns**
2. Chọn **Invoice** gốc để trả
3. Thêm chi tiết vào **ReturnItems**
4. Khi approve:
   - Cập nhật Stocks (cộng số lượng trả)
   - Ghi lại refund trong Invoices (tạo record mới hoặc update)
   - Cập nhật Customer purchase_history

**Ví dụ**:
```
Return TR001:
- Invoice: HD001
- ReturnItems:
  * Hapacol (LOT202501): 3 viên @ 60,000 = 180,000
- Total Refund: 180,000
- Stocks:
  * Hapacol: unit_quantity + 3
```

---

### Luồng 4: QUẢN LÝ NHÂN SỰ (HR Flow)
```
Employees → Attendance ──────→ Payroll
              ↓                   ↓
            (tính giờ)       (tính lương)
                              ↓
                            Banks (thanh toán)
```

**Quy trình chi tiết**:
1. Mỗi ngày nhân viên **check-in/check-out**
2. Hệ thống ghi lại **Attendance**:
   - Tính working_hours, overtime_hours
   - Xác định status (present/absent/leave/etc)
3. Cuối tháng, tính **Payroll**:
   - Base = basic_salary
   - Cộng benefits (điểm danh, hoa hồng, thưởng)
   - Trừ deductions (BHXH, thuế, vay)
   - gross_salary = base + benefits
   - net_salary = gross_salary - deductions
4. Thanh toán qua **Banks** (bank_transfer hoặc cash)

**Ví dụ**:
```
Tháng 1/2025:
- Attendance: 21 ngày có mặt, 1 ngày phép
- Benefits: 
  * Điểm danh: 20 ngày × 20,000 = 400,000
  * Hoa hồng: 5 hóa đơn × 200,000 = 1,000,000
- Deductions:
  * BHXH (8%): 800,000
  * PIT: 300,000
- Payroll:
  * Gross: 8,000,000 + 1,400,000 = 9,400,000
  * Net: 9,400,000 - 1,100,000 = 8,300,000
```

---

## Ví dụ thực tế

### Scenario 1: Quy trình mua hàng hoàn chỉnh

**Ngày 1: Nhập kho từ Sunrise Pharma**
```
1. Tạo Purchase:
   - supplier_id: "Sunrise Pharma"
   - invoice_no: "SPH-2025-001"
   - date: "2025-01-20"
   
2. Thêm PurchaseItems:
   - Hapacol 500mg: batch="LOT202501001", qty=50 boxes (5000 units)
   - Brufen 400mg: batch="LOT202501004", qty=30 boxes (3000 units)
   
3. Confirm nhập kho:
   - Stocks created/updated:
     * Hapacol: batch_id="LOT202501001", unit_qty=5000, expiry=2026-05-01
     * Brufen: batch_id="LOT202501004", unit_qty=3000, expiry=2026-04-15
   
4. Update Supplier balance:
   - Sunrise Pharma balance += 175,600,000 VND
```

**Ngày 2: Bán hàng cho khách hàng**
```
1. Nhân viên NV001 tạo Invoice:
   - customer_id: "KH523490" (Nguyễn Văn A)
   - invoice_no: "HD001-20250121"
   - created_by: "NV001"
   
2. Chọn Voucher:
   - code: "WELCOME10" (giảm 10%, max 50,000)
   
3. Thêm InvoiceItems:
   [Item 1]
   - medicine: Hapacol 500mg
   - batch_id: LOT202501001
   - quantity: 10 viên
   - price: 60,000 (snapshot)
   - subtotal: 600,000
   
   [Item 2]
   - medicine: Brufen 400mg
   - batch_id: LOT202501004
   - quantity: 5 viên
   - price: 30,000 (snapshot)
   - subtotal: 150,000
   
4. Tính tiền:
   - subtotal: 750,000
   - voucher_discount: 50,000 (10% of 750,000, capped at 50,000)
   - after_discount: 700,000
   - vat_total: 70,000 (10%)
   - grand_total: 770,000
   
5. Thanh toán:
   - payment_method: "card"
   - paid: 770,000
   - payment_status: "completed"
   
6. Update Stocks:
   - Hapacol (LOT202501001): unit_qty: 5000 → 4990
   - Brufen (LOT202501004): unit_qty: 3000 → 2995
   
7. Update Customer:
   - purchase_history.push({date: "2025-01-21", items: [...]})
   
8. Update Voucher:
   - WELCOME10: usage_count: 449 → 450
   
9. Update Employee:
   - NV001: invoices_created += 1
```

**Ngày 3: Khách trả hàng**
```
1. Khách hàng KH523490 trả 3 viên Hapacol (hết hạn)
   
2. Tạo CustomerReturn:
   - returnNumber: "TR001-20250122"
   - invoice: "HD001-20250121"
   - customer: "KH523490"
   - returnDate: "2025-01-22"
   - reason: "Hạn sử dụng sắp hết"
   - status: "pending"
   
3. Thêm ReturnItems:
   - medicine: Hapacol 500mg
   - batch_id: LOT202501001
   - quantity: 3
   - unitPrice: 60,000
   - amount: 180,000
   
4. Duyệt return:
   - status: "approved"
   - Update Stocks:
     * Hapacol (LOT202501001): unit_qty: 4990 → 4993
   - Process refund: 180,000
   - Update Customer balance
```

---

### Scenario 2: Tính lương tháng 1

**Thông tin nhân viên NV001 (Trần Thị B)**:
- Basic salary: 8,000,000/tháng
- Designation: Sales Staff

**Dữ liệu Attendance tháng 1**:
- Ngày làm việc lý thuyết: 22 ngày
- Ngày có mặt: 21 ngày
- Ngày phép: 1 ngày
- Overtime: 8 giờ

**Lương tháng 1/2025**:
```
Payroll:
- employee: NV001
- month: 1, year: 2025
- basic_salary: 8,000,000

Benefits:
- Lương chuyên cần (21/22): 8,000,000 × 21/22 = 7,636,364
- Thưởng doanh số (5 hóa đơn): 5 × 200,000 = 1,000,000
- Thưởng attendance bonus: 500,000
- Total benefits: 2,000,000

Deductions:
- BHXH (8%): 640,000
- PIT (tính theo doanh số): 300,000
- Khoản vay còn nợ: 500,000
- Total deductions: 1,440,000

Final:
- gross_salary: 8,000,000 + 2,000,000 = 10,000,000
- net_salary: 10,000,000 - 1,440,000 = 8,560,000
- payment_date: "2025-02-01"
- payment_method: "bank_transfer"
- payment_status: "paid"
```

---

## Kết luận

ERD của hệ thống Pharmacare được thiết kế để:

1. **Quản lý master data** hiệu quả (Categories, Units, TypeMedicines, Suppliers, Banks)
2. **Theo dõi tồn kho chi tiết** (Medicines, Stocks) với hỗ trợ lô hàng (batch) và hạn dùng
3. **Ghi lại giao dịch hoàn chỉnh** (Purchases, Invoices) với khả năng nhập từ supplier và bán cho customer
4. **Hỗ trợ khuyến mãi** (Vouchers, VoucherUsages) với kiểm soát lặp lại
5. **Quản lý trả hàng** (CustomerReturns, ReturnItems) với cập nhật tồn kho
6. **Quản lý nhân sự** (Employees, Attendance, Payroll) với tính lương tự động

Các relationships được thiết kế để:
- Đảm bảo **data integrity** qua foreign keys
- Hỗ trợ **queries phức tạp** (ví dụ: lợi nhuận/tháng, tồn kho sắp hết hạn, lương nhân viên)
- Cho phép **audit trail** (lưu snapshot giá/tên tại thời điểm giao dịch)
- Dễ mở rộng cho các tính năng tương lai
