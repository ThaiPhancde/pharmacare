# PharmaCare - Tài Liệu Triển Khai Các Module Mới

## 📦 TÓM TẮT CÁC MODULE ĐÃ THÊM

### 1. **Voucher/Promotion Module**
- ✅ Model: `Voucher`, `VoucherUsage`
- ✅ API: `/api/voucher/*`, `/api/voucher/validate`
- ✅ Tích hợp vào Invoice model

### 2. **Human Resource (HR) Module**
- ✅ Models: `Employee`, `Attendance`, `Payroll`, `Expense`, `Loan`
- ✅ API: `/api/hr/employee/*`
- ✅ Menu: Employee, Attendance, Payroll, Expense, Loan

### 3. **Service Module** (Dịch vụ tư vấn y tế)
- ✅ Models: `Service`, `Appointment`
- ✅ API: `/api/service/*`, `/api/service/appointments/*`
- ✅ Menu: Service List, Appointments, Consultation

### 4. **Report Module**
- ✅ API: `/api/report/sales`, `/api/report/purchase`, `/api/report/product-sales`
- ✅ Menu: Sales Report, Purchase Report, Product Wise, Category Wise, User Wise, Closing List

### 5. **PayPal Payment Integration**
- ✅ API: `/api/payment/paypal/create-order`, `/api/payment/paypal/capture-order`
- ✅ Cập nhật Invoice model với `paypal_order_id`, `paypal_payer_id`

---

## 🔧 CÀI ĐẶT VÀ CẤU HÌNH

### 1. Cài đặt Dependencies (nếu cần PayPal)
```bash
# PayPal SDK (optional, hiện tại dùng fetch API)
npm install @paypal/checkout-server-sdk
```

### 2. Cập nhật file `.env`
Thêm các biến môi trường sau vào file `.env`:

```env
# Existing variables
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
GHN_TOKEN=your_ghn_token
GHN_SHOP_ID=your_shop_id
GEMINI_API_KEY=your_gemini_key

# NEW - PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
APP_URL=http://localhost:3000  # Your app URL
```

**Lấy PayPal credentials:**
1. Đăng ký tài khoản PayPal Developer: https://developer.paypal.com/
2. Tạo app mới trong Dashboard
3. Copy Client ID và Secret từ sandbox hoặc live app

---

## 📚 HƯỚNG DẪN SỬ DỤNG CÁC API

### **Voucher API**

#### 1. Tạo voucher mới
```typescript
POST /api/voucher
Body: {
  voucher_code: "SUMMER2025",
  name: "Summer Sale 50%",
  discount_type: "percentage", // hoặc "fixed"
  discount_value: 50,
  min_purchase_amount: 100000,
  max_discount_amount: 500000,
  usage_limit: 100,
  usage_limit_per_customer: 1,
  start_date: "2025-06-01",
  end_date: "2025-08-31",
  applicable_to: "all", // "medicine", "service", "category"
  status: "active"
}
```

#### 2. Kiểm tra voucher hợp lệ
```typescript
POST /api/voucher/validate
Body: {
  voucher_code: "SUMMER2025",
  invoice_total: 200000,
  customer_id: "customer_id_here",
  items: [...] // invoice items
}

Response: {
  status: true,
  data: {
    discount_amount: 100000,
    final_total: 100000
  }
}
```

### **Employee API (HR)**

```typescript
// Get all employees
GET /api/hr/employee?status=active&department=pharmacy

// Create employee
POST /api/hr/employee
Body: {
  full_name: "Nguyễn Văn A",
  email: "nva@example.com",
  phone: "0123456789",
  designation: "Pharmacist",
  department: "Pharmacy",
  date_of_joining: "2025-01-01",
  salary_basic: 10000000
}

// Update employee
PUT /api/hr/employee/[id]

// Delete employee
DELETE /api/hr/employee/[id]
```

### **Service & Appointment API**

```typescript
// Create service
POST /api/service
Body: {
  name: "Tư vấn bác sĩ tổng quát",
  category: "medical_consultation",
  price: 200000,
  duration: 30, // minutes
  requires_appointment: true,
  available_days: ["monday", "tuesday", "wednesday"],
  available_time_slots: ["09:00-10:00", "10:00-11:00"],
  max_appointments_per_slot: 5
}

// Book appointment
POST /api/service/appointments
Body: {
  service: "service_id",
  customer_name: "Nguyễn Văn B",
  customer_phone: "0987654321",
  customer_email: "nvb@example.com",
  appointment_date: "2025-11-01",
  time_slot: "09:00-10:00",
  notes: "Tư vấn sức khỏe tổng quát"
}
```

### **Report API**

```typescript
// Sales report
GET /api/report/sales?start_date=2025-01-01&end_date=2025-12-31

// Purchase report
GET /api/report/purchase?supplier=supplier_id

// Product-wise sales
GET /api/report/product-sales?medicine=medicine_id
```

### **PayPal Payment API**

```typescript
// Step 1: Create PayPal order
POST /api/payment/paypal/create-order
Body: {
  amount: 100.00,
  currency: "USD",
  description: "Invoice #12345"
}

Response: {
  order_id: "paypal_order_id",
  approval_url: "https://paypal.com/checkout?token=..."
}

// Step 2: User approves payment on PayPal

// Step 3: Capture payment
POST /api/payment/paypal/capture-order
Body: {
  order_id: "paypal_order_id"
}

Response: {
  status: true,
  data: {
    capture_id: "...",
    payer_email: "buyer@example.com"
  }
}
```

---

## 🎨 CẤU TRÚC DATABASE

### Voucher Collection
```javascript
{
  voucher_code: "SUMMER2025",
  name: "Summer Sale",
  discount_type: "percentage", // or "fixed"
  discount_value: 50,
  min_purchase_amount: 100000,
  max_discount_amount: 500000,
  usage_limit: 100,
  usage_count: 25,
  start_date: ISODate("2025-06-01"),
  end_date: ISODate("2025-08-31"),
  status: "active",
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### Employee Collection
```javascript
{
  employee_id: "EMP00001",
  full_name: "Nguyễn Văn A",
  email: "nva@example.com",
  phone: "0123456789",
  designation: "Pharmacist",
  department: "Pharmacy",
  date_of_joining: ISODate("2025-01-01"),
  salary_basic: 10000000,
  status: "active",
  createdAt: ISODate(),
  updatedAt: ISODate()
}
```

### Service Collection
```javascript
{
  service_id: "SRV00001",
  name: "Tư vấn bác sĩ",
  category: "medical_consultation",
  price: 200000,
  duration: 30,
  requires_appointment: true,
  available_days: ["monday", "tuesday"],
  available_time_slots: ["09:00-10:00"],
  max_appointments_per_slot: 5,
  status: "active"
}
```

### Appointment Collection
```javascript
{
  appointment_id: "APT000001",
  service: ObjectId("service_id"),
  customer: ObjectId("customer_id"), // optional
  customer_name: "Nguyễn Văn B",
  customer_phone: "0987654321",
  appointment_date: ISODate("2025-11-01"),
  time_slot: "09:00-10:00",
  status: "scheduled", // confirmed, completed, cancelled, no-show
  payment_status: "unpaid",
  createdAt: ISODate()
}
```

---

## 🚀 WORKFLOW TÍCH HỢP

### 1. **Voucher trong Invoice Flow**
```typescript
// Frontend - Invoice Creation
1. User nhập voucher code
2. Call API validate voucher
3. Nếu hợp lệ, áp dụng discount vào invoice
4. Lưu invoice với voucher_code, voucher_discount, voucher ID
5. Cập nhật usage_count của voucher (+1)
```

### 2. **PayPal Payment Flow**
```typescript
// Frontend - Checkout
1. User chọn PayPal payment method
2. Call /api/payment/paypal/create-order
3. Redirect user to approval_url
4. User approves on PayPal
5. PayPal redirects back với order_id
6. Call /api/payment/paypal/capture-order
7. Update invoice với paypal_order_id, payment_status="paid"
```

### 3. **Service Appointment Workflow**
```typescript
1. Customer chọn service
2. Xem available time slots
3. Book appointment
4. System check availability
5. Nếu đủ chỗ, tạo appointment
6. Gửi confirmation (email/SMS)
7. Sau khi hoàn thành, tạo invoice cho service
```

---

## 📝 VIỆC CẦN LÀM TIẾP THEO

### Frontend Pages & Components (Chưa tạo - cần làm tiếp)

1. **Voucher Management**
   - [ ] `pages/voucher/index.vue` - List vouchers
   - [ ] `pages/voucher/create.vue` - Create new voucher
   - [ ] `components/voucher/VoucherForm.vue`
   - [ ] `components/voucher/VoucherTable.vue`

2. **HR Management**
   - [ ] `pages/hr/employee/index.vue`
   - [ ] `pages/hr/attendance/index.vue`
   - [ ] `pages/hr/payroll/index.vue`
   - [ ] `pages/hr/expense/index.vue`
   - [ ] `pages/hr/loan/index.vue`
   - [ ] `components/hr/*` - Forms, Tables

3. **Service Management**
   - [ ] `pages/service/index.vue` - Service list
   - [ ] `pages/service/appointments/index.vue` - Appointment calendar
   - [ ] `pages/service/consultation/index.vue` - Consultation history
   - [ ] `components/service/AppointmentCalendar.vue`
   - [ ] `components/service/ServiceForm.vue`

4. **Reports**
   - [ ] `pages/report/sales.vue`
   - [ ] `pages/report/purchase.vue`
   - [ ] `pages/report/product-sales.vue`
   - [ ] `pages/report/category-sales.vue`
   - [ ] `pages/report/user-sales.vue`
   - [ ] `pages/report/closing.vue`
   - [ ] `components/report/ReportChart.vue`
   - [ ] `components/report/ReportTable.vue`

5. **Payment Integration**
   - [ ] Thêm PayPal button vào Invoice/POS page
   - [ ] `components/payment/PayPalButton.vue`
   - [ ] Payment success/failure pages

### Additional APIs cần tạo
- [ ] `/api/hr/attendance/*` - CRUD attendance
- [ ] `/api/hr/payroll/*` - CRUD payroll
- [ ] `/api/hr/expense/*` - CRUD expense
- [ ] `/api/hr/loan/*` - CRUD loan
- [ ] `/api/service/[id].ts` - Service detail
- [ ] `/api/service/appointments/[id].ts` - Appointment detail
- [ ] `/api/report/category-sales.ts`
- [ ] `/api/report/user-sales.ts`
- [ ] `/api/report/closing.ts`

---

## 🧪 TESTING

### Test Voucher
```bash
# Tạo voucher
curl -X POST http://localhost:3000/api/voucher \
  -H "Content-Type: application/json" \
  -d '{"voucher_code":"TEST50","name":"Test 50%","discount_type":"percentage","discount_value":50,"start_date":"2025-01-01","end_date":"2025-12-31"}'

# Validate voucher
curl -X POST http://localhost:3000/api/voucher/validate \
  -H "Content-Type: application/json" \
  -d '{"voucher_code":"TEST50","invoice_total":200000}'
```

### Test Employee
```bash
# Create employee
curl -X POST http://localhost:3000/api/hr/employee \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test Employee","email":"test@test.com","phone":"0123456789","designation":"Pharmacist","department":"Pharmacy","date_of_joining":"2025-01-01","salary_basic":10000000}'
```

---

## 📞 HỖ TRỢ

Nếu có vấn đề khi triển khai:
1. Kiểm tra MongoDB connection
2. Verify environment variables trong `.env`
3. Check server logs: `yarn dev`
4. Review API responses trong browser DevTools

---

## 📄 LICENSE

MIT License - PharmaCare © 2025
