# 🏥 PharmaCare AI Chatbot v3.0 - User Guide

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Tính Năng](#tính-năng)
3. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
4. [Quy Trình Tư Vấn](#quy-trình-tư-vấn)
5. [Ví Dụ Thực Tế](#ví-dụ-thực-tế)
6. [Lưu Ý Quan Trọng](#lưu-ý-quan-trọng)
7. [Troubleshooting](#troubleshooting)

---

## 🌟 Giới Thiệu

**PharmaCare AI v3.0** là trợ lý y tế thông minh được phát triển bằng **Gemini 2.0 Flash Experimental**, giúp bạn:

- ✅ Tư vấn sức khỏe tự động
- ✅ Đề xuất thuốc phù hợp
- ✅ Tra cứu thông tin thuốc
- ✅ Kiểm tra tồn kho & giá
- ✅ Phát hiện tương tác thuốc nguy hiểm

### 🎯 Điểm Nổi Bật
- **3-in-1 Unified AI**: Gộp 3 chatbot (basic, database, medical consultation) thành 1
- **Multi-turn Conversation**: Hỏi chi tiết như bác sĩ thật
- **SOAP Method**: Quy trình tư vấn y khoa chuẩn (Subjective, Objective, Assessment, Plan)
- **Smart Intent Detection**: Tự động nhận diện ý định người dùng (tư vấn, tìm thuốc, hỏi chung)
- **Rich UI**: Action buttons, medicine cards, progress indicators
- **Session Management**: Lưu lịch sử hội thoại 7 ngày

---

## 🚀 Tính Năng

### 1. **Tư Vấn Y Tế (Medical Consultation)**
- Phân tích triệu chứng bệnh
- Hỏi thông tin bệnh nhân (tuổi, giới tính, cân nặng, tiền sử bệnh)
- Kiểm tra dị ứng & thuốc đang dùng
- Đề xuất phác đồ điều trị
- Cảnh báo tương tác thuốc
- Hướng dẫn liều dùng, tác dụng phụ

### 2. **Tìm Kiếm Thuốc (Medicine Search)**
- Tra cứu theo tên thuốc
- Lọc theo loại (giảm đau, hạ sốt, kháng sinh...)
- Kiểm tra giá & tồn kho
- So sánh thuốc tương tự
- Tìm thuốc thay thế

### 3. **Hỏi Đáp Chung (General Query)**
- Hướng dẫn cách dùng thuốc
- Giải đáp thắc mắc về sức khỏe
- Tư vấn dinh dưỡng, chăm sóc bệnh nhân

### 4. **Giao Diện Tương Tác**
- **Action Buttons**: Click nhanh thay vì gõ
- **Medicine Cards**: Hiển thị thuốc đẹp mắt, đầy đủ thông tin
- **Progress Bar**: Theo dõi tiến trình tư vấn (6 bước)
- **Quick Filters**: Tìm nhanh theo loại thuốc
- **Suggested Questions**: Gợi ý câu hỏi phổ biến

---

## 📖 Hướng Dẫn Sử Dụng

### **Bước 1: Mở Chatbot**
- Nhấn vào **nút chat màu xanh** ở góc dưới bên phải màn hình
- Hoặc nhấn phím **Esc** để đóng/mở

### **Bước 2: Chọn Tab**
Có 3 tab:
1. **Tư Vấn**: Chat với AI Doctor
2. **Tìm Thuốc**: Quick search với filters
3. **Trợ Giúp**: Hướng dẫn & liên hệ

### **Bước 3: Bắt Đầu Hội Thoại**

#### **Cách 1: Click Action Buttons**
AI sẽ hiển thị 2 nút khi bắt đầu:
- 🩺 **Tư vấn bệnh** → Bắt đầu tư vấn y tế
- 🔍 **Tìm thuốc** → Chuyển sang tab tìm kiếm

#### **Cách 2: Gõ Tin Nhắn**
Ví dụ:
```
Tôi bị sốt và đau đầu
Tìm thuốc Paracetamol
Giá thuốc hạ sốt bao nhiêu?
Tôi đang uống thuốc gì cần tránh?
```

#### **Cách 3: Sử Dụng Quick Filters (Tab Tìm Thuốc)**
Nhấn vào:
- 💊 Giảm đau
- 🌡️ Hạ sốt
- 🦠 Kháng sinh
- 🤧 Dị ứng
- 🍽️ Tiêu hóa
- 🍊 Vitamin

#### **Cách 4: Chọn Câu Hỏi Gợi Ý**
AI đã chuẩn bị sẵn 6 câu hỏi phổ biến:
- Tôi bị sốt và đau đầu
- Ho có đờm màu vàng
- Đau bụng và tiêu chảy
- Tìm thuốc Paracetamol
- Giá thuốc hạ sốt
- Kiểm tra tồn kho

---

## 🩺 Quy Trình Tư Vấn (6 Bước)

### **1. Chào Hỏi (Greeting)**
AI tự giới thiệu và hỏi bạn muốn gì.

**Ví dụ:**
```
AI: Xin chào! Tôi là Bác sĩ AI của PharmaCare. 
    Bạn muốn tôi giúp gì hôm nay?
```

---

### **2. Thông Tin Bệnh Nhân (Patient Info)**
AI hỏi thông tin cá nhân để đưa ra tư vấn chính xác.

**AI sẽ hỏi:**
- Tuổi
- Giới tính
- Cân nặng
- Bệnh mãn tính (tiểu đường, cao huyết áp...)
- Dị ứng thuốc
- Thuốc đang dùng

**Ví dụ:**
```
User: Tôi bị sốt 39 độ
AI: Tôi hiểu. Để tư vấn chính xác, cho tôi biết:
    - Bạn bao nhiêu tuổi?
    - Giới tính?
    - Cân nặng?
    - Có bệnh mãn tính không?
```

**✅ Trả Lời Như Thế Nào?**
```
User: Tôi 25 tuổi, nam, 70kg, không có bệnh mãn tính
```

---

### **3. Thu Thập Triệu Chứng (Symptoms Inquiry)**
AI hỏi chi tiết về triệu chứng.

**AI sẽ hỏi:**
- Triệu chứng chính là gì? (sốt, đau đầu, ho...)
- Khi nào bắt đầu?
- Mức độ nghiêm trọng? (1-10)
- Các triệu chứng kèm theo?

**Ví dụ:**
```
AI: Bạn có triệu chứng nào kèm theo không?
    - Đau đầu
    - Buồn nôn
    - Chóng mặt
    - Sổ mũi, ho
```

**✅ Trả Lời:**
```
User: Có đau đầu và buồn nôn
```

---

### **4. Tiền Sử Bệnh (Medical History)**
AI hỏi về:
- Đã uống thuốc gì chưa?
- Có cải thiện không?
- Lần bị tương tự bao giờ chưa?
- Tiền sử gia đình?

**Ví dụ:**
```
AI: Bạn đã uống thuốc gì chưa?
User: Chưa uống thuốc gì
```

---

### **5. Phân Tích (Analysis)**
AI phân tích tình trạng của bạn dựa trên:
- Triệu chứng
- Tuổi, giới tính, cân nặng
- Tiền sử bệnh
- Database triệu chứng (10+ bệnh phổ biến)

**AI sẽ giải thích:**
```
AI: Dựa trên triệu chứng của bạn:
    
    📊 PHÂN TÍCH:
    - Sốt 39°C + đau đầu + buồn nôn
    - Có thể là cảm cúm thông thường
    - Cần theo dõi trong 24-48h
    
    ⚠️ DẤU HIỆU CẢNH BÁO:
    - Nếu sốt trên 40°C → Đến bệnh viện ngay
    - Nếu buồn nôn liên tục → Nguy cơ mất nước
```

---

### **6. Đề Xuất Điều Trị (Recommendation)**
AI đề xuất phác đồ điều trị chi tiết.

**AI sẽ cho:**
- **Thuốc đề xuất** (tên, liều dùng, tác dụng phụ)
- **Cách dùng** (uống trước/sau ăn, cách bao lâu...)
- **Lưu ý** (tương tác thuốc, chống chỉ định...)
- **Theo dõi** (khi nào cần tái khám)

**Ví dụ:**
```
AI: 💊 PHÁC ĐỒ ĐIỀU TRỊ:

    1. Paracetamol 500mg
       - Liều dùng: 1-2 viên/lần, 4-6h/lần
       - Tối đa: 4g/ngày
       - Uống sau ăn
       
    2. Vitamin C 1000mg
       - 1 viên/ngày
       - Tăng cường sức đề kháng
       
    ⚠️ LƯU Ý:
    - Uống đủ nước (2-3 lít/ngày)
    - Nghỉ ngơi tuyệt đối
    - Tái khám sau 3 ngày nếu không cải thiện
    
    [Đặt mua thuốc] [Hẹn tái khám] [Kết thúc]
```

**✅ Click Action Buttons:**
- **Đặt mua thuốc** → Hướng dẫn đặt mua
- **Hẹn tái khám** → Lên lịch tái khám
- **Kết thúc** → Kết thúc tư vấn

---

## 📝 Ví Dụ Thực Tế

### **Case 1: Tư Vấn Sốt Cảm**

```
User: Tôi bị sốt 38.5 độ
AI: Cho tôi biết thêm về bạn nhé:
    - Tuổi?
    - Giới tính?
    - Cân nặng?
    
User: 30 tuổi, nữ, 55kg

AI: Bạn có triệu chứng nào kèm theo không?
    [Đau đầu] [Ho] [Sổ mũi] [Đau họng]
    
User: *Click button "Đau đầu"*

AI: Bạn đã uống thuốc gì chưa?

User: Chưa

AI: 📊 PHÂN TÍCH:
    Triệu chứng giống cảm cúm thông thường
    
    💊 ĐIỀU TRỊ:
    1. Paracetamol 500mg - Hạ sốt, giảm đau
    2. Vitamin C - Tăng sức đề kháng
    
    [Mua ngay] [Hỏi thêm]
```

---

### **Case 2: Tìm Thuốc Theo Tên**

```
User: Tìm thuốc Paracetamol

AI: Tìm thấy 3 loại Paracetamol:
    
    📦 1. Paracetamol 500mg (Viên nén)
       Giá: 2,000đ/vỉ (10 viên)
       Tồn kho: 150 vỉ
       [Chi tiết] [Mua ngay]
       
    📦 2. Paracetamol 250mg (Siro - Trẻ em)
       Giá: 15,000đ/chai (100ml)
       Tồn kho: 50 chai
       [Chi tiết] [Mua ngay]
```

---

### **Case 3: Kiểm Tra Tương Tác Thuốc**

```
User: Tôi đang uống thuốc huyết áp, có uống thêm thuốc cảm được không?

AI: ⚠️ CẢNH BÁO QUAN TRỌNG!
    
    Bạn đang dùng thuốc gì để điều trị huyết áp?
    
User: Amlodipine

AI: 🔴 LƯU Ý:
    - Paracetamol: AN TOÀN ✅
    - Ibuprofen: KHÔNG NÊN ❌ (có thể làm giảm tác dụng hạ huyết áp)
    - Aspirin: HỎI BÁC SĨ ⚠️
    
    Nên dùng: Paracetamol thay vì các NSAID
```

---

### **Case 4: Tư Vấn Cho Bà Bầu**

```
User: Tôi đang mang thai 3 tháng, bị đau đầu

AI: ⚠️ QUAN TRỌNG: Bạn đang mang thai
    
    📊 PHÂN TÍCH:
    - Thai kỳ 3 tháng (Trimester 1)
    - Đau đầu là triệu chứng phổ biến
    
    💊 ĐIỀU TRỊ AN TOÀN:
    1. Paracetamol 500mg (FDA Category B - An toàn)
       - Tối đa 3g/ngày
       - Không dùng Ibuprofen ❌
       
    2. Biện pháp không dùng thuốc:
       - Nghỉ ngơi trong phòng tối
       - Chườm lạnh trán
       - Uống đủ nước
       
    ⚠️ KHI NÀO CẦN GẶP BÁC SĨ:
    - Đau đầu dữ dội đột ngột
    - Kèm theo mờ mắt, chóng mặt
    - Đau kéo dài > 3 ngày
```

---

## ⚠️ Lưu Ý Quan Trọng

### **1. Giới Hạn Của AI**
- ❌ **KHÔNG thay thế** bác sĩ thật
- ❌ **KHÔNG chẩn đoán** chính xác 100%
- ❌ **KHÔNG kê đơn** chính thức
- ✅ **CHỈ tư vấn** sơ bộ, hỗ trợ quyết định

### **2. Khi Nào Cần Đến Bệnh Viện Ngay?**
🚨 **DẤU HIỆU NGUY HIỂM:**
- Sốt trên 40°C không hạ
- Khó thở, thở nhanh
- Co giật, mất ý thức
- Đau ngực dữ dội
- Chảy máu không cầm được
- Đau bụng dữ dội, đột ngột
- Triệu chứng đột quỵ (méo mặt, yếu tay chân, nói khó)

### **3. Đối Tượng Đặc Biệt**
AI sẽ tư vấn cẩn trọng cho:
- 👶 **Trẻ em** dưới 12 tuổi
- 🤰 **Phụ nữ mang thai** / cho con bú
- 👴 **Người cao tuổi** trên 65 tuổi
- 🏥 **Bệnh nhân mãn tính** (tiểu đường, gan, thận, tim mạch)

### **4. Quy Tắc An Toàn**
- ✅ Luôn nói rõ **tuổi, cân nặng, bệnh nền**
- ✅ Kê khai **đầy đủ thuốc đang dùng**
- ✅ Thông báo **dị ứng thuốc** nếu có
- ✅ Đọc kỹ **liều dùng** trước khi uống
- ✅ Theo dõi **tác dụng phụ**, báo ngay nếu bất thường

### **5. Bảo Mật Thông Tin**
- 🔒 Lịch sử chat **lưu trên trình duyệt** của bạn (localStorage)
- 🔒 **Không upload** lên server
- 🔒 Tự động **xóa sau 7 ngày**
- 🔒 Bạn có thể **xóa thủ công** bất cứ lúc nào (nút Refresh trên header)

---

## 🛠️ Troubleshooting

### **Lỗi 1: AI Không Trả Lời**
**Nguyên nhân:**
- Server chết
- Mất kết nối mạng
- Gemini API limit

**Giải pháp:**
1. Check xem server có chạy không: `http://localhost:3000`
2. F12 → Console → Xem lỗi gì
3. Thử lại sau vài phút

---

### **Lỗi 2: AI Trả Lời Sai / Không Liên Quan**
**Nguyên nhân:**
- Câu hỏi không rõ ràng
- Thiếu thông tin
- AI nhầm intent

**Giải pháp:**
1. Hỏi lại rõ ràng hơn:
   - ❌ "Thuốc gì?"
   - ✅ "Tìm thuốc hạ sốt cho trẻ em"
   
2. Cung cấp đủ thông tin:
   - Tuổi, cân nặng
   - Triệu chứng chi tiết
   - Thuốc đang dùng

---

### **Lỗi 3: Lịch Sử Chat Bị Mất**
**Nguyên nhân:**
- Xóa cache trình duyệt
- Quá 7 ngày tự động xóa

**Giải pháp:**
- Không xóa localStorage
- Export chat history (tính năng chưa có, sẽ thêm v3.1)

---

### **Lỗi 4: Progress Bar Không Di Chuyển**
**Nguyên nhân:**
- AI không cập nhật consultationStage

**Giải pháp:**
- AI tự động cập nhật khi chuyển stage
- Nếu không đổi → AI đang chờ bạn trả lời thêm thông tin

---

## 🎓 Tips & Tricks

### **1. Hỏi Ngắn Gọn**
✅ "Tôi sốt 39 độ"  
❌ "Hôm nay tôi thấy người hơi nóng, đo nhiệt độ thì 39 độ, không biết có sao không"

### **2. Sử Dụng Action Buttons**
Thay vì gõ → Click buttons nhanh hơn

### **3. Tab "Tìm Thuốc" Cho Tra Cứu Nhanh**
Không cần chat → Vào tab Tìm Thuốc → Click filter

### **4. Lưu Thông Tin Quan Trọng**
Copy phác đồ điều trị → Lưu vào Notes

### **5. Keyboard Shortcuts**
- `Esc`: Đóng/mở chat
- `Enter`: Gửi tin nhắn

---

## 🆘 Hỗ Trợ

### **Liên Hệ:**
- 📞 **Hotline:** 1900-xxxx (24/7)
- 📧 **Email:** support@pharmacare.vn
- 🌐 **Website:** https://pharmacare.vn
- 💬 **Facebook:** fb.com/pharmacare

### **Góp Ý / Báo Lỗi:**
- GitHub Issues: `https://github.com/your-repo/pharmacare/issues`
- Email: dev@pharmacare.vn

---

## 📚 Tài Liệu Tham Khảo

- [README-CHATBOT.md](./README-CHATBOT.md) - Tài liệu kỹ thuật
- [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Hướng dẫn cài đặt
- [docs/ghn-integration.md](./docs/ghn-integration.md) - Tích hợp vận chuyển

---

## 🔄 Version History

### **v3.0 (Current)**
- ✅ Unified Medical AI (gộp 3 chatbot)
- ✅ Multi-turn consultation (6 stages)
- ✅ SOAP method
- ✅ Rich UI (buttons, cards, progress bar)
- ✅ Session management (7-day history)
- ✅ 10+ symptom database

### **v2.0**
- Medical consultation chatbot
- Database context search
- Basic Q&A

### **v1.0**
- Simple chatbot
- Text-only responses

---

## 📝 Changelog

**[2024-06-XX] v3.0 Release**
- Merged 3 chatbots into unified system
- Added conversation stage progress
- Implemented SOAP method
- Added action buttons & medicine cards
- Session management with localStorage
- Improved UI/UX
- Added keyboard shortcuts
- 10+ symptom database with drug interactions

---

## 📄 License

MIT License - PharmaCare Project © 2024

---

**🌟 Cảm ơn bạn đã sử dụng PharmaCare AI!**  
Chúc bạn luôn khỏe mạnh! 💊
