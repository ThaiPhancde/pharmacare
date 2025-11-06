# 🧪 Hướng Dẫn Testing Image Recognition

## Tổng Quan

Guide này hướng dẫn test tính năng nhận diện thuốc từ ảnh của PharmaCare Chatbot.

**Cập nhật:** 30/10/2025  
**Phiên bản:** 1.0  
**Trạng thái:** Ready for Testing

---

## 📋 Checklist Testing

### Phase 5.1: Backend Testing (API Endpoint)

#### ✅ Test 1: Upload Ảnh Hợp Lệ
**Mục đích:** Kiểm tra API xử lý ảnh JPEG/PNG < 5MB

**Cách test:**
```bash
# PowerShell
cd "d:\LAST PROJECT\pharmacare"

# Test với ảnh mẫu (chuẩn bị 1 ảnh thuốc)
# Tạo file test-upload.ps1:
$imagePath = "path/to/medicine-image.jpg"
$sessionId = [guid]::NewGuid().ToString()

$form = @{
    image = Get-Item -Path $imagePath
    sessionId = $sessionId
}

Invoke-RestMethod -Uri "http://localhost:3000/api/chatbot/analyze-medicine-image" `
    -Method Post `
    -Form $form `
    -ContentType "multipart/form-data"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "recognized": {
      "medicineName": "Paracetamol",
      "confidence": 95,
      "brandName": "...",
      "ingredients": "..."
    },
    "databaseMatch": {
      "found": true,
      "medicines": [...]
    },
    "imageUrl": "/uploads/medicine-images/..."
  },
  "message": "Phân tích ảnh thành công"
}
```

**Pass/Fail:** ⬜

---

#### ✅ Test 2: Upload File Không Hợp Lệ
**Mục đích:** Validate file type và size

**Test Cases:**
- ✅ File PDF → Expected: `"Chỉ chấp nhận file ảnh JPEG/PNG"`
- ✅ File > 5MB → Expected: `"Kích thước file tối đa 5MB"`
- ✅ File corrupt → Expected: `"Không thể đọc file ảnh"`

**Pass/Fail:** ⬜

---

#### ✅ Test 3: Ảnh Không Chứa Thuốc
**Mục đích:** Gemini nhận diện ảnh random

**Test:**
- Upload ảnh con mèo/đồ ăn
- Expected: `confidence < 50`, `medicineName: "Không xác định"`

**Pass/Fail:** ⬜

---

#### ✅ Test 4: Database Matching
**Mục đích:** Tìm thuốc trong MongoDB sau khi nhận diện

**Test:**
- Upload ảnh thuốc có trong DB (VD: Paracetamol)
- Expected: `databaseMatch.found = true`, có thông tin giá/stock

**Pass/Fail:** ⬜

---

#### ✅ Test 5: Expired Medicine Warning
**Mục đích:** Cảnh báo thuốc hết hạn

**Test:**
- Upload ảnh thuốc có `expiryDate` trong quá khứ
- Expected: Response có `expiryStatus: "expired"`, `daysUntilExpiry < 0`

**Pass/Fail:** ⬜

---

### Phase 5.2: Frontend Testing (UI/UX)

#### ✅ Test 6: Camera Button Hiển Thị
**Cách test:**
1. Mở chatbot (http://localhost:3000)
2. Kiểm tra button 📷 bên cạnh input

**Expected:** Button hiển thị với icon camera

**Pass/Fail:** ⬜

---

#### ✅ Test 7: Upload Modal Toggle
**Cách test:**
1. Click button camera
2. Modal "Chụp ảnh thuốc" xuất hiện
3. Click nút X để đóng

**Expected:** Modal mở/đóng mượt mà, không lag

**Pass/Fail:** ⬜

---

#### ✅ Test 8: File Selection & Preview
**Cách test:**
1. Click "Chọn ảnh"
2. Chọn file JPEG
3. Xem preview

**Expected:** 
- Preview hiển thị ảnh ngay lập tức
- Button "Chọn lại" xuất hiện

**Pass/Fail:** ⬜

---

#### ✅ Test 9: Client-side Validation
**Cách test:**
1. Chọn file PDF
2. Chọn file > 5MB

**Expected:**
- Hiển thị error message "Chỉ chấp nhận file ảnh JPEG/PNG"
- Hiển thị error "Kích thước file tối đa 5MB"

**Pass/Fail:** ⬜

---

#### ✅ Test 10: Upload Progress
**Cách test:**
1. Upload ảnh
2. Quan sát loading overlay

**Expected:**
- Icon loading quay
- Progress bar tăng từ 0% → 100%
- Text "Đang phân tích..."

**Pass/Fail:** ⬜

---

#### ✅ Test 11: Success Response Display
**Cách test:**
1. Upload ảnh thuốc Paracetamol
2. Chờ response

**Expected:**
- User message: "[Đã gửi ảnh thuốc: Paracetamol]"
- Bot message:
  - ✅ Nhận diện: Paracetamol
  - 🎯 Độ chính xác: 95%
  - 💊 Thành phần: ...
  - 📦 Tìm thấy trong kho!
  - 💰 Giá: ...
  - Action buttons: "Xem chi tiết", "Hỏi cách dùng", "Đặt mua"

**Pass/Fail:** ⬜

---

#### ✅ Test 12: Not Found Response
**Cách test:**
1. Upload ảnh thuốc không có trong DB

**Expected:**
- Bot message: "❌ Không tìm thấy trong kho"
- Action buttons: "Tìm thuốc tương tự", "Liên hệ đặt hàng"

**Pass/Fail:** ⬜

---

#### ✅ Test 13: Action Buttons
**Cách test:**
1. Click button "Xem chi tiết"
2. Click button "Hỏi cách dùng"

**Expected:**
- Button "Hỏi cách dùng" → Gửi query tự động
- Button "Xem chi tiết" → Trigger action tương ứng

**Pass/Fail:** ⬜

---

### Phase 5.3: Mobile Responsive Testing

#### ✅ Test 14: Mobile Layout
**Cách test:**
1. Mở DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Chọn iPhone 12 Pro

**Expected:**
- Camera button không bị crop
- Upload modal fit màn hình
- Preview image không bị tràn
- Action buttons wrap xuống dòng

**Pass/Fail:** ⬜

---

#### ✅ Test 15: Tablet Layout
**Cách test:**
1. Chọn iPad Air trong DevTools

**Expected:**
- Layout responsive, không bị lỗi

**Pass/Fail:** ⬜

---

### Phase 5.4: Edge Cases & Error Handling

#### ✅ Test 16: Network Error
**Cách test:**
1. Tắt dev server
2. Upload ảnh

**Expected:**
- Error message: "Không thể kết nối đến server"

**Pass/Fail:** ⬜

---

#### ✅ Test 17: Gemini API Rate Limit
**Cách test:**
1. Upload > 15 ảnh liên tiếp (free tier limit)

**Expected:**
- Retry logic tự động chạy
- Hoặc message: "Vượt giới hạn, vui lòng thử lại sau"

**Pass/Fail:** ⬜

---

#### ✅ Test 18: Ảnh Mờ/Tối
**Cách test:**
1. Upload ảnh blur/tối

**Expected:**
- `confidence < 70%`
- Message: "⚠️ Độ chính xác thấp"
- Tip: "Chụp ảnh rõ nét hơn..."

**Pass/Fail:** ⬜

---

#### ✅ Test 19: Multiple Uploads
**Cách test:**
1. Upload ảnh A
2. Chờ xong
3. Upload ảnh B

**Expected:**
- Mỗi ảnh tạo session riêng
- Không conflict

**Pass/Fail:** ⬜

---

#### ✅ Test 20: Session Persistence
**Cách test:**
1. Upload ảnh
2. Refresh trang
3. Kiểm tra chat history

**Expected:**
- Message "[Đã gửi ảnh thuốc]" vẫn hiển thị
- Session ID không đổi

**Pass/Fail:** ⬜

---

## 🐛 Bug Reporting Template

**Bug ID:** #  
**Severity:** Critical / High / Medium / Low  
**Test Case:** Test #  
**Expected:**  
**Actual:**  
**Steps to Reproduce:**  
1. 
2. 
3. 

**Screenshots:**  
(Attach)

**Browser/Device:**  
- Browser: Chrome 120
- OS: Windows 11
- Screen: 1920x1080

**Notes:**

---

## 📊 Test Summary

| Phase | Total | Pass | Fail | Skip | Pass Rate |
|-------|-------|------|------|------|-----------|
| 5.1 Backend | 5 | ⬜ | ⬜ | ⬜ | 0% |
| 5.2 Frontend | 8 | ⬜ | ⬜ | ⬜ | 0% |
| 5.3 Mobile | 2 | ⬜ | ⬜ | ⬜ | 0% |
| 5.4 Edge Cases | 5 | ⬜ | ⬜ | ⬜ | 0% |
| **TOTAL** | **20** | **⬜** | **⬜** | **⬜** | **0%** |

**Tester:** _____________  
**Date:** _____________  
**Sign-off:** _____________

---

## 🚀 Next Steps

1. **Fix Critical Bugs** → Retest
2. **Fix High/Medium Bugs** → Retest
3. **Sign-off when Pass Rate ≥ 95%**
4. **Proceed to Phase 6: Documentation & Deployment**

---

## 📝 Notes

- Test với ảnh thuốc thật từ database
- Chuẩn bị ít nhất 10 ảnh mẫu (clear/blur/expired/not-found)
- Test trên Chrome, Firefox, Safari
- Test mobile bằng thiết bị thật (không chỉ emulator)
