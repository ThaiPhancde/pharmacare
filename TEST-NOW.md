# 🧪 TEST NGAY BÂY GIỜ - Image Upload Feature

## ✅ Đã Fix
- ❌ **Lỗi cũ**: Component name sai `MedicineImageUpload` 
- ✅ **Đã sửa**: Đổi thành `ChatbotMedicineImageUpload` (Nuxt auto-import convention)
- ✅ **Server**: Đang chạy trên http://localhost:3001/
- ✅ **HMR**: Auto-reload thành công (4 lần)

---

## 📋 Test Checklist - 5 Phút

### Bước 1: Kiểm Tra UI (1 phút)
1. Mở browser: **http://localhost:3001/**
2. Login vào hệ thống (nếu cần)
3. Tìm và click vào **Chatbot icon** (góc dưới phải hoặc menu)
4. Chatbot popup hiển thị

✅ **Mong đợi**: Chatbot mở với giao diện chat

---

### Bước 2: Test Nút Upload (1 phút)
1. Tìm **nút 📤 upload ảnh** bên cạnh ô input tin nhắn
2. Click vào nút upload

✅ **Mong đợi**: 
- Modal hiển thị với tiêu đề "📤 Tải ảnh thuốc lên để nhận diện"
- Có vùng upload với icon "image-plus-outline"
- Có nút "Chọn ảnh từ file" màu xanh
- Text hướng dẫn: "Chọn ảnh thuốc để nhận diện"

❌ **Nếu vẫn lỗi**: 
- Hiển thị text lỗi thay vì component
- F12 console có lỗi gì không?
- Component không render đúng

---

### Bước 3: Test Upload File (2 phút)

#### 3a. Test Invalid File
1. Click "Chọn ảnh từ file"
2. Chọn file `.txt` hoặc `.pdf`

✅ **Mong đợi**: Hiển thị error message trong chat: "Chỉ chấp nhận file ảnh JPEG/PNG"

#### 3b. Test Valid File
1. Click "Chọn ảnh từ file"
2. Chọn file ảnh JPEG/PNG bất kỳ (có thể ảnh random)
3. Chờ 3-5 giây

✅ **Mong đợi**: 
- Preview ảnh hiển thị
- Loading spinner với progress bar
- Bot trả lời với kết quả nhận diện:
  - Tên thuốc (hoặc "Không tìm thấy")
  - Confidence score %
  - Nếu tìm thấy trong DB: Giá, tồn kho, hạn SD

---

### Bước 4: Kiểm Tra Console (1 phút)
1. Mở DevTools (F12)
2. Tab **Console**
3. Kiểm tra:

✅ **Không có lỗi đỏ** (red errors)
✅ **API call**: `POST /api/chatbot/analyze-medicine-image` 
✅ **Response**: Status 200 OK

❌ **Nếu có lỗi**:
```
- Component not found → Nuxt chưa nhận diện component
- 404 API endpoint → Backend chưa chạy đúng
- 500 Server Error → Gemini API key hoặc MongoDB issue
```

---

## 🐛 Debug Steps

### Nếu Component Vẫn Không Hiển Thị

#### 1. Verify Component File Exists
```powershell
ls components\chatbot\MedicineImageUpload.vue
```
✅ File phải tồn tại

#### 2. Check Nuxt Auto-Import
```powershell
cat .nuxt\components.d.ts | Select-String "MedicineImageUpload"
```
✅ Phải có entry: `ChatbotMedicineImageUpload`

#### 3. Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
yarn dev
```

#### 4. Clear Nuxt Cache
```powershell
rm -r .nuxt
yarn dev
```

---

## 📸 Nếu Cần Ảnh Test

### Download Nhanh:
1. Google: "paracetamol 500mg box vietnam"
2. Download 2-3 ảnh thuốc rõ nét
3. Save vào folder test/

### Hoặc Test Với Ảnh Random:
- Bất kỳ ảnh JPEG/PNG nào cũng được
- Kết quả sẽ là "Không tìm thấy thuốc" (expected)
- Mục đích test: Upload flow hoạt động

---

## ✅ Success Criteria

**PASS nếu:**
- ✅ Modal upload hiển thị đúng (không phải text lỗi)
- ✅ Chọn file ảnh → Preview hiển thị
- ✅ Loading indicator hoạt động
- ✅ Bot response với kết quả (dù là "không tìm thấy")
- ✅ Console không có lỗi đỏ

**FAIL nếu:**
- ❌ Modal vẫn là text lỗi
- ❌ Upload crash hoặc timeout
- ❌ Console có lỗi Component not found
- ❌ API 404/500

---

## 📞 Next Steps

### Nếu Test PASS:
1. Test với ảnh thuốc thật (có tên rõ)
2. Verify DB matching hoạt động
3. Test mobile responsive
4. Move to Phase 6: Documentation

### Nếu Test FAIL:
1. Copy error từ console
2. Check terminal output
3. Restart server với cache clear
4. Report lỗi chi tiết

---

**Time**: ~5 phút test cơ bản  
**Ready?** Mở http://localhost:3001/ và bắt đầu! 🚀
