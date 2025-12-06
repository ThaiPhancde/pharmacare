# ✅ CHECKLIST XÁC NHẬN - VOUCHER & HR MODULE

## 📁 FILES ĐÃ XÓA

Kiểm tra các folder/file sau đã KHÔNG còn tồn tại:

- [ ] `pages/service/` folder
- [ ] `pages/service/index.vue`
- [ ] `pages/service/appointments/`
- [ ] `pages/service/consultation/`
- [ ] `server/api/service/` folder
- [ ] `server/api/service/index.ts`
- [ ] `server/api/service/appointments/`
- [ ] `pages/hr/loan/` folder
- [ ] `pages/hr/loan/index.vue`

## 📁 FILES ĐÃ TẠO MỚI

Kiểm tra các file sau đã TỒN TẠI:

### Models (server/models/)
- [ ] `Campaign.ts`
- [ ] `HRExtended.ts` (chứa Shift + Benefit)
- [ ] `Voucher.ts` (đã có sẵn)

### API Routes (server/api/)
- [ ] `voucher/campaigns/index.ts`
- [ ] `voucher/campaigns/[id].ts`
- [ ] `voucher/apply.post.ts`
- [ ] `hr/shift/index.ts`
- [ ] `hr/shift/[id].ts`
- [ ] `hr/benefits/index.ts`
- [ ] `hr/benefits/[id].ts`

### Components (components/)
- [ ] `voucher/VoucherList.vue`
- [ ] `voucher/VoucherForm.vue`

### Pages (pages/)
- [ ] `voucher/index.vue` (đã có)
- [ ] `hr/shift/index.vue`
- [ ] `hr/benefits/index.vue`

### Documentation (docs/)
- [ ] `VOUCHER-HR-IMPLEMENTATION.md`
- [ ] `../VOUCHER-HR-UPDATE.md` (root level)
- [ ] `../IMPLEMENTATION-SUMMARY.md` (root level)

## 🔍 KIỂM TRA MENU

Mở file `constants/menus.ts` và kiểm tra:

### Đã XÓA:
- [ ] KHÔNG còn menu "Service" với children
- [ ] KHÔNG còn submenu "Loan" trong HR

### Đã CÓ:
- [ ] Menu "Voucher" (icon: i-lucide-ticket, link: /voucher)
- [ ] Submenu "Shift Management" trong HR (link: /hr/shift)
- [ ] Submenu "Benefits" trong HR (link: /hr/benefits)

Menu HR phải có cấu trúc:
```
Human Resource
  ├─ Employee
  ├─ Attendance
  ├─ Shift Management    ← MỚI
  ├─ Payroll
  ├─ Benefits            ← MỚI
  └─ Expense
```

## 🧪 TEST CHỨC NĂNG

### A. Test Voucher Module

1. **Truy cập trang Voucher**
   - [ ] Mở browser: `http://localhost:3000/voucher`
   - [ ] Trang load thành công (không có lỗi)
   - [ ] Hiển thị danh sách vouchers (nếu có data)

2. **Test API Voucher List**
   ```bash
   curl http://localhost:3000/api/voucher
   ```
   - [ ] Response status: true
   - [ ] Có field "data" và "total"

3. **Test Create Voucher** (qua UI hoặc API)
   ```bash
   curl -X POST http://localhost:3000/api/voucher \
     -H "Content-Type: application/json" \
     -d '{
       "voucher_code": "TEST10",
       "name": "Test Voucher",
       "discount_type": "percentage",
       "discount_value": 10,
       "start_date": "2024-01-01",
       "end_date": "2024-12-31",
       "status": "active"
     }'
   ```
   - [ ] Voucher được tạo thành công
   - [ ] Code tự động uppercase

4. **Test Apply Voucher**
   ```bash
   curl -X POST http://localhost:3000/api/voucher/apply \
     -H "Content-Type: application/json" \
     -d '{
       "voucher_code": "TEST10",
       "subtotal": 100000,
       "items": []
     }'
   ```
   - [ ] Response có discount_amount
   - [ ] final_amount = subtotal - discount_amount

### B. Test Campaign Module

1. **Test API Campaign List**
   ```bash
   curl http://localhost:3000/api/voucher/campaigns
   ```
   - [ ] Response status: true

2. **Test Create Campaign**
   ```bash
   curl -X POST http://localhost:3000/api/voucher/campaigns \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Campaign",
       "campaign_type": "seasonal",
       "start_date": "2024-01-01",
       "end_date": "2024-12-31"
     }'
   ```
   - [ ] Campaign được tạo

### C. Test Shift Management

1. **Truy cập trang Shift**
   - [ ] Mở browser: `http://localhost:3000/hr/shift`
   - [ ] Trang load thành công
   - [ ] Hiển thị bảng danh sách ca làm việc

2. **Test API Shift List**
   ```bash
   curl http://localhost:3000/api/hr/shift
   ```
   - [ ] Response status: true

3. **Test Create Shift** (yêu cầu có employee)
   - [ ] Click button "Tạo ca làm việc"
   - [ ] Dialog mở ra
   - [ ] Form có đầy đủ fields: employee, date, shift_type, times

### D. Test Benefits Management

1. **Truy cập trang Benefits**
   - [ ] Mở browser: `http://localhost:3000/hr/benefits`
   - [ ] Trang load thành công

2. **Test API Benefits List**
   ```bash
   curl http://localhost:3000/api/hr/benefits
   ```
   - [ ] Response status: true

3. **Test Create Benefit**
   - [ ] Click button "Tạo phúc lợi"
   - [ ] Dialog mở ra
   - [ ] Form có đầy đủ fields: employee, type, amount, frequency

## 🔐 KIỂM TRA DATABASE

Nếu có MongoDB Compass/Atlas:

1. **Check Collections**
   - [ ] Collection `vouchers` tồn tại (hoặc sẽ tạo khi insert)
   - [ ] Collection `campaigns` tồn tại
   - [ ] Collection `shifts` tồn tại
   - [ ] Collection `benefits` tồn tại

2. **Check Indexes**
   - [ ] Voucher có index trên `voucher_code`
   - [ ] Campaign có index trên `status`, `start_date`, `end_date`
   - [ ] Shift có index trên `employee`, `shift_date`
   - [ ] Benefit có index trên `employee`, `status`

## 🌐 KIỂM TRA UI

### Navigation Menu
- [ ] Click vào menu "Voucher" → Chuyển đến /voucher
- [ ] Mở "Human Resource" → Thấy 6 submenu (không còn Loan)
- [ ] Click "Shift Management" → Chuyển đến /hr/shift
- [ ] Click "Benefits" → Chuyển đến /hr/benefits
- [ ] KHÔNG còn menu "Service" trong sidebar

### Pages UI
1. **Voucher Page**
   - [ ] Có search box
   - [ ] Có filter status dropdown
   - [ ] Có button "Create Voucher"
   - [ ] Table hiển thị đúng columns

2. **Shift Page**
   - [ ] Có button "Tạo ca làm việc"
   - [ ] Table hiển thị nhân viên, ngày, ca, giờ
   - [ ] Status có màu badge (scheduled, completed...)

3. **Benefits Page**
   - [ ] Có button "Tạo phúc lợi"
   - [ ] Table hiển thị loại, tên, số tiền
   - [ ] Amount format VNĐ

## 📱 RESPONSIVE CHECK

- [ ] Voucher page responsive trên mobile
- [ ] Shift page responsive trên mobile
- [ ] Benefits page responsive trên mobile
- [ ] Menu sidebar toggle trên mobile

## ⚠️ ERROR CHECK

### Console Errors
- [ ] Mở DevTools Console
- [ ] Không có lỗi màu đỏ khi load trang
- [ ] Không có 404 errors cho API routes

### Network Tab
- [ ] API calls thành công (status 200)
- [ ] Response đúng format IResponse<T>

## 📝 DOCUMENTATION CHECK

- [ ] File `VOUCHER-HR-IMPLEMENTATION.md` có đầy đủ sections
- [ ] File `VOUCHER-HR-UPDATE.md` có table of contents
- [ ] File `IMPLEMENTATION-SUMMARY.md` có checklist tasks

## 🚀 PRODUCTION READINESS

- [ ] Tất cả tests trên đều pass
- [ ] Không có lỗi critical trong console
- [ ] API responses đúng format
- [ ] UI/UX hoạt động mượt mà
- [ ] Menu navigation đúng như mong đợi

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành checklist:
- ✅ **9/10 tasks hoàn thành** (chỉ còn tích hợp voucher vào invoice)
- ✅ Menu Services đã bị xóa hoàn toàn
- ✅ Menu HR không còn Loan
- ✅ Voucher module hoạt động đầy đủ
- ✅ HR Extended (Shift + Benefits) hoạt động đầy đủ
- ✅ Documentation đầy đủ

## ❓ NẾU GẶP LỖI

### Lỗi 404 trên API routes
→ Restart dev server: `yarn dev`

### Lỗi MongoDB connection
→ Kiểm tra `.env` có `MONGODB_URI`

### Component không load
→ Check `components.d.ts` đã generate

### Menu không cập nhật
→ Hard refresh browser (Ctrl+Shift+R)

---

**Last Updated**: 2024  
**Status**: Ready for Testing ✅
