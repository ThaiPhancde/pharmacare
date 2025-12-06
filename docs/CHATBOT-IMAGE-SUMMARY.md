# 📊 Tóm Tắt: Kế Hoạch Tích Hợp Nhận Diện Hình Ảnh Thuốc

## 🎯 Mục Tiêu
Nâng cấp chatbot AI của PharmaCare để có thể nhận diện thuốc từ hình ảnh, tự động tìm kiếm trong database và trả về thông tin giá, tồn kho.

---

## 📋 Tổng Quan

### Hiện Tại (v3.0)
- ✅ Chatbot AI với Gemini 2.0 Flash
- ✅ 3 loại tư vấn: Medical Consultation, Medicine Search, General Query
- ✅ Database: Medicine + Stock với MongoDB
- ✅ UI: Action buttons, conversation stages, session management

### Mục Tiêu Mới (v3.1)
- ✅ Upload/chụp ảnh thuốc
- ✅ AI nhận diện: Tên, thương hiệu, HSD, lô hàng
- ✅ Tự động tìm trong database
- ✅ Hiển thị giá, tồn kho, cảnh báo hết hạn

---

## 🏗️ Kiến Trúc

### Flow Tổng Quan
```
User → Upload ảnh 
     → Frontend: Validate & Preview
     → POST /api/chatbot/analyze-medicine-image
     → Backend: Gemini Vision API + Database Search
     → Response: Recognition data + Database matches
     → Frontend: Display results with action buttons
```

### Tech Stack
- **AI**: Google Gemini 2.0 Flash (Multimodal) - ĐÃ CÓ API KEY
- **Image Processing**: Sharp (resize, optimize)
- **Upload**: Multer (multipart form-data)
- **OCR Backup**: Tesseract.js (nếu cần)
- **Frontend**: Vue 3 + File Upload Component

---

## 📁 Files Cần Tạo/Sửa

### Backend (3 files)
1. **`server/services/imageUpload.ts`** (MỚI)
   - Multer config
   - File validation
   - Image optimization với Sharp

2. **`server/services/geminiVision.ts`** (MỚI)
   - Gọi Gemini Vision API
   - Parse JSON response
   - Error handling

3. **`server/api/chatbot/analyze-medicine-image.ts`** (MỚI)
   - API endpoint chính
   - Multipart form-data
   - Search database
   - Return results

### Frontend (2 files)
4. **`components/chatbot/MedicineImageUpload.vue`** (MỚI)
   - Upload button + preview
   - Client-side validation
   - Call API

5. **`components/chatbot/PharmaCareAdvancedBot.vue`** (CẬP NHẬT)
   - Thêm camera button
   - Toggle upload modal
   - Display results

---

## ⏱️ Timeline

| Ngày | Công Việc | Thời Gian |
|------|-----------|-----------|
| **Day 1** | Backend Services (imageUpload.ts, geminiVision.ts) | 4h |
| **Day 2** | API Endpoint (analyze-medicine-image.ts) + Testing | 6h |
| **Day 3** | Frontend Component (MedicineImageUpload.vue) | 4h |
| **Day 4** | Integration + UI Polish + Testing | 6h |
| **Day 5** | Bug Fixes + Documentation + Deployment | 4h |
| **TOTAL** | | **24h (3-5 ngày)** |

---

## 🔑 Key Features

### 1. Upload Ảnh
- **Client**: File input, preview, validate (type, size)
- **Server**: Multer, optimize với Sharp (resize 1200x1200, JPEG 85%)

### 2. Nhận Diện AI
- **Gemini Vision API**: Multimodal input (image + prompt)
- **Extract**: Tên thuốc, thương hiệu, hoạt chất, HSD, số lô, NSX
- **Confidence Score**: 0-100%

### 3. Tìm Kiếm Database
- **Search Medicine**: By name, generic name, brand
- **Join Stock**: Get quantity, expiry date, batch code
- **Check Expiry**: Cảnh báo nếu hết hạn

### 4. Hiển Thị Kết Quả
- **Recognition Info**: Tên, HSD, confidence
- **Database Matches**: Cards với giá, tồn kho, status
- **Action Buttons**: "Xem chi tiết", "Đặt mua", "Tìm tương tự"

---

## 🧪 Testing Checklist

### Test Cases
- ✅ Ảnh rõ nét → Confidence >90% → Tìm thấy trong DB
- ✅ Ảnh mờ → Confidence <70% → Yêu cầu chụp lại
- ✅ Thuốc không có trong DB → Gợi ý tương tự
- ✅ Thuốc hết hạn → Cảnh báo đỏ
- ✅ Ảnh không phải thuốc → Confidence 0% → Reject
- ✅ Upload 5MB image → Success
- ✅ Upload 6MB image → Error "File quá lớn"

### Performance
- Response time < 5s (1MB image)
- Rate limiting: 10 requests/minute
- Concurrent uploads: No crashes

---

## 📚 Documentation

### Đã Tạo
1. **`docs/CHATBOT-IMAGE-RECOGNITION-PLAN.md`**
   - Kiến trúc chi tiết
   - Code samples (backend + frontend)
   - API design
   - Challenges & solutions

2. **`docs/CHATBOT-IMAGE-GUIDE-USER.md`**
   - Hướng dẫn user sử dụng
   - Tips chụp ảnh đúng cách
   - Troubleshooting
   - FAQ

3. **`docs/IMPLEMENTATION-CHECKLIST.md`**
   - Checklist đầy đủ (7 phases)
   - Timeline chi tiết
   - Test cases

### Cần Cập Nhật
- [ ] `README.md`: Thêm tính năng mới
- [ ] `CHATBOT-USER-GUIDE.md`: Thêm phần Image Recognition

---

## 🚀 Next Steps (Để Dev Bắt Đầu)

### Step 1: Install Dependencies
```bash
cd pharmacare
pnpm add sharp multer @google/generative-ai
pnpm add -D @types/multer @types/sharp
```

### Step 2: Tạo Upload Directory
```bash
mkdir -p public/uploads/medicine-images
mkdir -p public/uploads/temp
```

### Step 3: Verify API Key
```bash
# Check .env file
cat .env | grep GEMINI_API_KEY
# Should output: GEMINI_API_KEY=AIzaSy...
```

### Step 4: Tạo Backend Services
Tạo 2 files:
- `server/services/imageUpload.ts` (theo template trong PLAN.md)
- `server/services/geminiVision.ts` (theo template trong PLAN.md)

### Step 5: Tạo API Endpoint
Tạo file:
- `server/api/chatbot/analyze-medicine-image.ts`

### Step 6: Test Backend
```bash
# Start dev server
pnpm dev

# Test API với Thunder Client/Postman
POST http://localhost:3000/api/chatbot/analyze-medicine-image
Body: form-data
  - image: [chọn file ảnh thuốc]
  - sessionId: "test-123"
```

### Step 7: Tạo Frontend Component
Tạo file:
- `components/chatbot/MedicineImageUpload.vue`

### Step 8: Cập Nhật Chatbot
Sửa file:
- `components/chatbot/PharmaCareAdvancedBot.vue`
  - Thêm camera button
  - Import MedicineImageUpload
  - Handle upload events

### Step 9: Testing
- Test upload ảnh
- Test nhận diện
- Test database search
- Test UI/UX

### Step 10: Deploy
- Push to git
- Deploy to Vercel/staging
- Monitor errors
- Collect feedback

---

## ⚠️ Important Notes

### API Rate Limits
- **Gemini Free Tier**: 15 requests/minute
- **Solution**: 
  - Rate limiting trên server (10 req/min)
  - Cache results (5 min TTL)
  - Client-side validation để giảm invalid requests

### Image Quality
- **Problem**: Ảnh mờ/tối → confidence thấp
- **Solution**:
  - Tips chụp ảnh trong UI
  - Client-side quality check
  - Fallback to OCR (Tesseract.js)

### Database Matching
- **Problem**: Tên thuốc khác nhau (VD: "Paracetamol" vs "Hapacol")
- **Solution**:
  - Fuzzy search
  - Search by generic name
  - AI suggest similar medicines

### Security
- **Risks**: Malicious file upload, path traversal, DoS
- **Mitigations**:
  - File type validation (only JPEG/PNG)
  - File size limit (5MB)
  - Rate limiting (10/min)
  - Auto-delete temp files (24h)

---

## 📊 Success Metrics

### Technical
- ✅ API response time < 5s
- ✅ Recognition accuracy > 85%
- ✅ Database match rate > 70%
- ✅ Zero downtime

### User Experience
- ✅ Upload success rate > 95%
- ✅ User satisfaction > 4/5
- ✅ Feature adoption rate > 50% (of chatbot users)

---

## 🎓 Resources

### Documentation
- [Gemini API - Multimodal](https://ai.google.dev/tutorials/multimodal_input)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Multer File Upload](https://github.com/expressjs/multer)

### Code Templates
- Xem chi tiết trong `docs/CHATBOT-IMAGE-RECOGNITION-PLAN.md`

### Implementation Checklist
- Xem `docs/IMPLEMENTATION-CHECKLIST.md`

### User Guide
- Xem `docs/CHATBOT-IMAGE-GUIDE-USER.md`

---

## 🤝 Team Responsibilities

### Backend Developer
- Services (imageUpload, geminiVision)
- API endpoint
- Database integration
- Testing

### Frontend Developer
- Upload component
- Chatbot integration
- UI/UX polish
- Client-side validation

### QA/Tester
- Test cases
- Bug reports
- User acceptance testing

### DevOps
- Deployment
- Monitoring
- Performance optimization

---

## 📞 Contact

- **Project Lead**: [Your Name]
- **Backend**: [Backend Dev]
- **Frontend**: [Frontend Dev]
- **QA**: [QA Engineer]

---

**Status:** 📋 Planning Complete - Ready for Implementation  
**Created:** 2025-10-30  
**Next Review:** After Phase 1 completion
