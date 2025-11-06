# Hướng Dẫn Module Voucher & Human Resources

## Tổng quan

Tài liệu này mô tả chi tiết về 2 modules mới được triển khai:
1. **Voucher Management** - Quản lý mã giảm giá và chiến dịch khuyến mãi
2. **Human Resources Extended** - Quản lý ca làm việc và phúc lợi nhân viên

## 1. VOUCHER MANAGEMENT

### 1.1. Database Models

#### Voucher Model (`server/models/Voucher.ts`)
Đã có sẵn với các trường:
- `voucher_code`: Mã voucher (unique, uppercase)
- `name`: Tên voucher
- `description`: Mô tả
- `discount_type`: 'percentage' | 'fixed'
- `discount_value`: Giá trị giảm
- `min_purchase_amount`: Đơn hàng tối thiểu
- `max_discount_amount`: Giảm tối đa (với percentage)
- `usage_limit`: Tổng số lượt sử dụng
- `usage_limit_per_customer`: Lượt dùng/khách hàng
- `start_date`, `end_date`: Thời gian hiệu lực
- `applicable_to`: 'all' | 'medicine' | 'category'
- `status`: 'active' | 'inactive' | 'expired'

#### Campaign Model (`server/models/Campaign.ts`)
Model mới để nhóm vouchers:
- `name`: Tên chiến dịch
- `description`: Mô tả
- `campaign_type`: 'seasonal' | 'loyalty' | 'product' | 'clearance' | 'other'
- `start_date`, `end_date`: Thời gian chiến dịch
- `status`: 'active' | 'inactive' | 'completed'
- `total_vouchers`: Tổng số voucher trong campaign
- `used_vouchers`: Số lượt đã sử dụng
- `total_revenue`, `total_discount`: Thống kê doanh thu

### 1.2. API Endpoints

#### Voucher APIs
```
GET    /api/voucher              - Lấy danh sách vouchers (có filter)
POST   /api/voucher              - Tạo voucher mới
GET    /api/voucher/[id]         - Chi tiết voucher
PUT    /api/voucher/[id]         - Cập nhật voucher
DELETE /api/voucher/[id]         - Xóa voucher
POST   /api/voucher/apply        - Áp dụng voucher khi checkout
```

**Apply Voucher Request:**
```json
{
  "voucher_code": "SUMMER2024",
  "customer_id": "optional_customer_id",
  "subtotal": 500000,
  "items": [
    {
      "medicine": { "_id": "medicine_id" },
      "quantity": 2
    }
  ]
}
```

**Apply Voucher Response:**
```json
{
  "status": true,
  "data": {
    "voucher_id": "...",
    "voucher_code": "SUMMER2024",
    "discount_type": "percentage",
    "discount_value": 10,
    "discount_amount": 50000,
    "final_amount": 450000
  },
  "message": "Áp dụng voucher thành công"
}
```

#### Campaign APIs
```
GET    /api/voucher/campaigns              - Danh sách campaigns
POST   /api/voucher/campaigns              - Tạo campaign mới
GET    /api/voucher/campaigns/[id]         - Chi tiết campaign (kèm vouchers)
PUT    /api/voucher/campaigns/[id]         - Cập nhật campaign
DELETE /api/voucher/campaigns/[id]         - Xóa campaign
```

### 1.3. Frontend Components

#### VoucherList (`components/voucher/VoucherList.vue`)
- Hiển thị bảng danh sách vouchers
- Filter theo status, search theo code/name
- Actions: Edit, Delete
- Emit events: `edit`, `delete`

#### VoucherForm (`components/voucher/VoucherForm.vue`)
- Dialog form tạo/sửa voucher
- Props: `open`, `editData`
- Emit: `update:open`, `success`
- Validation: Required fields (code, name, dates, discount)

### 1.4. Pages

#### `/voucher` - Danh sách Vouchers
- Sử dụng Naive UI DataTable
- Hiển thị: Code, Name, Discount, Usage, Validity, Status
- Actions: Edit, Delete

### 1.5. Tích hợp vào Invoice

Để tích hợp voucher vào invoice, thêm vào component tạo invoice:

```vue
<script setup>
const voucherCode = ref('')
const appliedVoucher = ref(null)

async function applyVoucher() {
  const response = await useApi('/api/voucher/apply', {
    method: 'POST',
    body: {
      voucher_code: voucherCode.value,
      customer_id: selectedCustomer.value?._id,
      subtotal: calculateSubtotal(),
      items: cartItems.value
    }
  })
  
  if (response.status) {
    appliedVoucher.value = response.data
    // Cập nhật giá cuối cùng
    finalAmount.value = response.data.final_amount
  }
}
</script>

<template>
  <div>
    <Input v-model="voucherCode" placeholder="Nhập mã voucher" />
    <Button @click="applyVoucher">Áp dụng</Button>
    
    <div v-if="appliedVoucher">
      Giảm giá: {{ appliedVoucher.discount_amount }} VNĐ
    </div>
  </div>
</template>
```

## 2. HUMAN RESOURCES EXTENDED

### 2.1. Database Models

#### Shift Model (`server/models/HRExtended.ts`)
Quản lý ca làm việc:
- `employee`: Ref to Employee
- `shift_date`: Ngày làm việc
- `shift_type`: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day'
- `start_time`, `end_time`: Giờ bắt đầu/kết thúc (HH:mm)
- `hours_worked`: Số giờ làm
- `overtime_hours`: Giờ tăng ca
- `status`: 'scheduled' | 'completed' | 'absent' | 'cancelled'
- `notes`: Ghi chú

#### Benefit Model (`server/models/HRExtended.ts`)
Quản lý phúc lợi:
- `employee`: Ref to Employee
- `benefit_type`: 'insurance' | 'bonus' | 'allowance' | 'training' | 'welfare' | 'other'
- `benefit_name`: Tên phúc lợi
- `description`: Mô tả
- `amount`: Số tiền
- `effective_date`, `expiry_date`: Thời gian hiệu lực
- `status`: 'active' | 'inactive' | 'expired'
- `payment_frequency`: 'one-time' | 'monthly' | 'quarterly' | 'yearly'
- `notes`: Ghi chú

### 2.2. API Endpoints

#### Shift APIs
```
GET    /api/hr/shift               - Danh sách ca làm việc (filter: employee, date, status)
POST   /api/hr/shift               - Tạo ca mới
GET    /api/hr/shift/[id]          - Chi tiết ca
PUT    /api/hr/shift/[id]          - Cập nhật ca
DELETE /api/hr/shift/[id]          - Xóa ca
```

#### Benefits APIs
```
GET    /api/hr/benefits            - Danh sách phúc lợi (filter: employee, benefit_type, status)
POST   /api/hr/benefits            - Tạo phúc lợi mới
GET    /api/hr/benefits/[id]       - Chi tiết phúc lợi
PUT    /api/hr/benefits/[id]       - Cập nhật phúc lợi
DELETE /api/hr/benefits/[id]       - Xóa phúc lợi
```

### 2.3. Pages

#### `/hr/shift` - Quản lý ca làm việc
- DataTable với columns: Nhân viên, Ngày, Ca, Giờ làm, Số giờ, Trạng thái
- Dialog form: Chọn nhân viên, ngày, loại ca, giờ, trạng thái
- Actions: Edit, Delete

#### `/hr/benefits` - Quản lý phúc lợi
- DataTable: Nhân viên, Loại, Tên, Số tiền, Tần suất, Ngày hiệu lực, Trạng thái
- Dialog form: Chọn nhân viên, loại phúc lợi, số tiền, tần suất chi trả
- Actions: Edit, Delete

### 2.4. Tính lương tích hợp Shift

Để tích hợp tính lương từ dữ liệu ca làm việc, update page `/hr/payroll`:

```typescript
async function calculateSalary(employeeId: string, month: string) {
  // Lấy tất cả ca trong tháng
  const shifts = await api.get('/api/hr/shift', {
    params: {
      employee: employeeId,
      // Filter theo tháng
    }
  })
  
  // Tính tổng giờ làm và giờ tăng ca
  const totalHours = shifts.data.reduce((sum, s) => sum + s.hours_worked, 0)
  const overtimeHours = shifts.data.reduce((sum, s) => sum + s.overtime_hours, 0)
  
  // Tính lương
  const baseSalary = employee.hourly_rate * totalHours
  const overtimePay = employee.hourly_rate * 1.5 * overtimeHours
  
  // Lấy phúc lợi trong tháng
  const benefits = await api.get('/api/hr/benefits', {
    params: {
      employee: employeeId,
      status: 'active'
    }
  })
  
  const monthlyBenefits = benefits.data
    .filter(b => b.payment_frequency === 'monthly')
    .reduce((sum, b) => sum + b.amount, 0)
  
  return baseSalary + overtimePay + monthlyBenefits
}
```

## 3. MENU NAVIGATION

Menu đã được cập nhật trong `constants/menus.ts`:

### Đã xóa:
- ❌ Service menu (toàn bộ)
- ❌ Loan submenu trong HR

### Đã thêm:
- ✅ Voucher menu (icon: ticket)
- ✅ Shift Management submenu trong HR
- ✅ Benefits submenu trong HR

Menu HR mới:
```typescript
{
  title: "Human Resource",
  icon: "i-lucide-users-round",
  children: [
    { title: "Employee", link: "/hr/employee" },
    { title: "Attendance", link: "/hr/attendance" },
    { title: "Shift Management", link: "/hr/shift" },      // Mới
    { title: "Payroll", link: "/hr/payroll" },
    { title: "Benefits", link: "/hr/benefits" },           // Mới
    { title: "Expense", link: "/hr/expense" },
  ]
}
```

## 4. TÍNH NĂNG BỔ SUNG ĐỀ XUẤT

### 4.1. Giới hạn mua thuốc kê đơn
Thêm vào Medicine model:
```typescript
prescription_required: Boolean
max_quantity_per_day: Number  // Giới hạn số lượng/ngày
```

Kiểm tra khi tạo invoice:
```typescript
async function validatePrescriptionMedicines(items) {
  const prescriptionItems = items.filter(item => 
    item.medicine.prescription_required
  )
  
  // Kiểm tra đã mua hôm nay chưa
  const today = new Date().setHours(0,0,0,0)
  const todayInvoices = await Invoice.find({
    customer: customerId,
    createdAt: { $gte: today }
  })
  
  // Tính tổng đã mua
  // So sánh với max_quantity_per_day
}
```

### 4.2. Kết toán cuối ca
Tạo model `ShiftClosing`:
```typescript
{
  shift: ObjectId,
  employee: ObjectId,
  opening_balance: Number,
  closing_balance: Number,
  total_sales: Number,
  cash_in_drawer: Number,
  discrepancy: Number,
  notes: String
}
```

API `/api/hr/shift/close`:
```typescript
POST /api/hr/shift/close
{
  shift_id: "...",
  cash_in_drawer: 5000000
}
```

## 5. TESTING

### Test Voucher
1. Tạo voucher mới với discount 10%
2. Áp dụng voucher khi checkout
3. Kiểm tra usage_count tăng
4. Test voucher hết hạn/hết lượt

### Test HR
1. Tạo ca làm việc cho nhân viên
2. Tạo phúc lợi hàng tháng
3. Tính lương dựa trên ca và phúc lợi
4. Kiểm tra trạng thái ca (completed, absent)

## 6. FILES ĐÃ TẠO/SỬA

### Models
- ✅ `server/models/Campaign.ts` (mới)
- ✅ `server/models/HRExtended.ts` (mới)
- ✅ `server/models/Voucher.ts` (đã có)

### API Routes
- ✅ `server/api/voucher/campaigns/index.ts` (mới)
- ✅ `server/api/voucher/campaigns/[id].ts` (mới)
- ✅ `server/api/voucher/apply.post.ts` (mới)
- ✅ `server/api/hr/shift/index.ts` (mới)
- ✅ `server/api/hr/shift/[id].ts` (mới)
- ✅ `server/api/hr/benefits/index.ts` (mới)
- ✅ `server/api/hr/benefits/[id].ts` (mới)

### Components
- ✅ `components/voucher/VoucherList.vue` (mới)
- ✅ `components/voucher/VoucherForm.vue` (mới)

### Pages
- ✅ `pages/voucher/index.vue` (đã có)
- ✅ `pages/hr/shift/index.vue` (mới)
- ✅ `pages/hr/benefits/index.vue` (mới)

### Config
- ✅ `constants/menus.ts` (đã cập nhật)

### Đã xóa
- ❌ `pages/service/` (toàn bộ folder)
- ❌ `server/api/service/` (toàn bộ folder)
- ❌ `pages/hr/loan/` (toàn bộ folder)

## 7. NEXT STEPS

1. **Tích hợp Voucher vào Invoice POS** (`pages/invoice/pos.vue`)
2. **Tích hợp Shift vào Payroll** (`pages/hr/payroll/index.vue`)
3. **Thêm Reports cho Voucher** (doanh thu theo campaign)
4. **Thêm Dashboard cho HR** (tổng quan ca làm việc, phúc lợi)
5. **Implement giới hạn mua thuốc kê đơn**
6. **Thêm tính năng kết toán cuối ca**

---

**Lưu ý**: Các lỗi lint hiện tại (import order, string quotes) có thể fix bằng ESLint auto-fix hoặc để sau. Chức năng chính đã hoạt động đầy đủ.
