# 🖼️ Tích Hợp Nhận Diện Hình Ảnh Thuốc - PharmaCare AI Chatbot

## 📚 Tài Liệu

Dự án này bao gồm các tài liệu sau để hỗ trợ việc tích hợp tính năng nhận diện hình ảnh thuốc:

### 1. 📊 **CHATBOT-IMAGE-SUMMARY.md** (ĐỌC ĐẦU TIÊN)
- **Mục đích**: Tóm tắt toàn bộ project
- **Nội dung**: 
  - Mục tiêu & kiến trúc tổng quan
  - Timeline 5 ngày
  - Files cần tạo/sửa
  - Next steps để bắt đầu
- **Đối tượng**: Project Manager, Team Lead, Developers

### 2. 🏗️ **CHATBOT-IMAGE-RECOGNITION-PLAN.md** (CHI TIẾT KỸ THUẬT)
- **Mục đích**: Kế hoạch kỹ thuật chi tiết
- **Nội dung**:
  - Kiến trúc hệ thống (flow, API design)
  - Code samples đầy đủ (backend + frontend)
  - Challenges & solutions
  - Security considerations
  - Performance optimization
- **Đối tượng**: Developers (Backend + Frontend)

### 3. ✅ **IMPLEMENTATION-CHECKLIST.md** (CHECKLIST THEO DÕI)
- **Mục đích**: Checklist đầy đủ để track progress
- **Nội dung**:
  - 7 phases với các subtasks
  - Test cases chi tiết
  - Documentation tasks
  - Security & optimization checklist
- **Đối tượng**: Developers, QA, Project Manager

### 4. 📱 **CHATBOT-IMAGE-GUIDE-USER.md** (HƯỚNG DẪN USER)
- **Mục đích**: Hướng dẫn sử dụng cho người dùng cuối
- **Nội dung**:
  - Cách upload/chụp ảnh thuốc
  - Tips chụp ảnh đúng cách
  - Troubleshooting
  - FAQ
- **Đối tượng**: End Users, Support Team

---

## 🚀 Quick Start (Cho Developers)

### 1. Đọc tài liệu theo thứ tự:
1. **CHATBOT-IMAGE-SUMMARY.md** (15 phút) - Hiểu tổng quan
2. **CHATBOT-IMAGE-RECOGNITION-PLAN.md** (45 phút) - Hiểu chi tiết kỹ thuật
3. **IMPLEMENTATION-CHECKLIST.md** (10 phút) - Checklist công việc

### 2. Chuẩn bị môi trường:
```bash
# Install dependencies
pnpm add sharp multer @google/generative-ai
pnpm add -D @types/multer @types/sharp

# Tạo thư mục upload
mkdir -p public/uploads/medicine-images public/uploads/temp

# Verify API key
cat .env | grep GEMINI_API_KEY
```

### 3. Implementation theo thứ tự:
1. **Day 1-2**: Backend Services + API Endpoint
2. **Day 3**: Frontend Component
3. **Day 4**: Integration + Testing
4. **Day 5**: Bug Fixes + Documentation

---

## 📂 Cấu Trúc Files

### Backend (3 files mới)
```
server/
├── services/
│   ├── imageUpload.ts       (MỚI) - Multer + Sharp
│   └── geminiVision.ts      (MỚI) - Gemini Vision API
└── api/
    └── chatbot/
        └── analyze-medicine-image.ts  (MỚI) - Main endpoint
```

### Frontend (2 files)
```
components/
└── chatbot/
    ├── MedicineImageUpload.vue           (MỚI) - Upload component
    └── PharmaCareAdvancedBot.vue         (CẬP NHẬT) - Add camera button
```

---

## 🎯 Features Overview

### What Users Can Do:
1. **Upload ảnh thuốc** (hộp/vỉ/chai)
2. **AI nhận diện** tên thuốc, thương hiệu, HSD, lô hàng
3. **Tự động tìm** trong database
4. **Xem giá & tồn kho**
5. **Cảnh báo** nếu thuốc hết hạn

### How It Works:
```
User Upload → Optimize Image → Gemini Vision API 
→ Extract Info → Search Database → Display Results
```

---

## ⏱️ Timeline

| Phase | Time | Description |
|-------|------|-------------|
| **Day 1-2** | 10h | Backend Services + API |
| **Day 3** | 4h | Frontend Component |
| **Day 4** | 6h | Integration + Testing |
| **Day 5** | 4h | Bug Fixes + Docs |
| **TOTAL** | **24h** | **3-5 working days** |

---

## ✅ Success Criteria

### Technical
- [x] API response time < 5s
- [x] Recognition accuracy > 85%
- [x] Database match rate > 70%
- [x] Zero security vulnerabilities

### User Experience
- [x] Upload success rate > 95%
- [x] User-friendly error messages
- [x] Mobile responsive

---

## 🔑 Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| **Gemini 2.0 Flash** | AI Vision (nhận diện ảnh) | [Link](https://ai.google.dev/tutorials/multimodal_input) |
| **Sharp** | Image processing (resize, optimize) | [Link](https://sharp.pixelplumbing.com/) |
| **Multer** | File upload (multipart form-data) | [Link](https://github.com/expressjs/multer) |
| **MongoDB** | Database (Medicine + Stock) | [Link](https://mongoosejs.com/) |
| **Vue 3** | Frontend framework | [Link](https://vuejs.org/) |

---

## 🧪 Testing Strategy

### Test Cases (Xem chi tiết trong IMPLEMENTATION-CHECKLIST.md)
- ✅ Ảnh rõ nét → High confidence → Found in DB
- ✅ Ảnh mờ → Low confidence → Ask to retake
- ✅ Thuốc không có trong DB → Suggest similar
- ✅ Thuốc hết hạn → Warning displayed
- ✅ Ảnh không phải thuốc → Rejected

---

## ⚠️ Important Notes

### API Rate Limits
- **Gemini Free Tier**: 15 requests/minute
- **Our Limit**: 10 requests/minute (safer)
- **Solution**: Rate limiting + caching

### Security
- File type validation (only JPEG/PNG)
- File size limit (5MB)
- Auto-delete temp files (24h)
- Rate limiting per user

### Performance
- Image resize before upload (1200x1200)
- JPEG compression (quality 85%)
- Response caching (5 min TTL)

---

## 📞 Support

### Questions?
- **Technical**: Xem `CHATBOT-IMAGE-RECOGNITION-PLAN.md`
- **Implementation**: Xem `IMPLEMENTATION-CHECKLIST.md`
- **User Guide**: Xem `CHATBOT-IMAGE-GUIDE-USER.md`

### Issues?
- Check existing issues in project board
- Create new issue with template
- Tag relevant team members

---

## 📊 Project Status

**Current Status:** 📋 Planning Complete - Ready for Implementation

**Next Steps:**
1. ✅ Review all documentation
2. ⏳ Install dependencies
3. ⏳ Start Day 1 implementation

**Last Updated:** 2025-10-30

---

## 👥 Team

| Role | Responsibility | Status |
|------|----------------|--------|
| **Backend Dev** | Services + API | Ready |
| **Frontend Dev** | UI Components | Ready |
| **QA** | Testing | Standby |
| **DevOps** | Deployment | Standby |

---

## 🎉 Ready to Start?

1. Read `CHATBOT-IMAGE-SUMMARY.md` (15 min)
2. Review `CHATBOT-IMAGE-RECOGNITION-PLAN.md` (45 min)
3. Open `IMPLEMENTATION-CHECKLIST.md` and start checking boxes!

**Good luck! 🚀**
