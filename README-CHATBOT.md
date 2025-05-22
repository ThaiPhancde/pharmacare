# Hướng dẫn sử dụng Chatbot PharmaCare

## Tổng quan

Chatbot PharmaCare là một hệ thống trả lời tự động các câu hỏi liên quan đến thuốc và dược phẩm. Hệ thống sử dụng MongoDB để lưu trữ dữ liệu và Node.js để xử lý logic.

## Quy trình hoạt động

1. **Nhận câu hỏi từ người dùng** thông qua API `/api/chatbot/message`

2. **Xử lý tìm kiếm câu trả lời**:
   - Đầu tiên tìm kiếm câu hỏi chính xác trong database
   - Nếu không tìm thấy, sử dụng hàm `findSimilar` để tìm câu hỏi tương tự:
     - Phân tích và chuẩn hóa câu hỏi
     - Trích xuất từ khóa và tên thuốc
     - Phát hiện danh mục (price, dosage, side-effects, etc.)
     - Tìm kiếm câu hỏi tương tự dựa vào danh mục và từ khóa
     - Tính điểm tương đồng và trả về kết quả phù hợp nhất

3. **Trả về câu trả lời**:
   - Nếu tìm thấy câu trả lời trong database, trả về ngay
   - Nếu không, dùng Gemini API để tạo câu trả lời
   - Lưu lịch sử hội thoại trong collection chatbots

## Cấu trúc dữ liệu

Hệ thống sử dụng hai collection chính:

1. **chatbotqas**: Lưu trữ các cặp câu hỏi - câu trả lời
   - question: Câu hỏi
   - answer: Câu trả lời
   - category: Danh mục (price, dosage, side-effects, etc.)
   - keywords: Từ khóa
   - medicineTerms: Tên thuốc

2. **chatbots**: Lưu trữ lịch sử hội thoại
   - userId: ID người dùng
   - role: Vai trò người dùng
   - messages: Các tin nhắn
   - context: Ngữ cảnh hội thoại

## Các script quản lý

### 1. Fix lỗi giá thuốc hiển thị [object Object]

Script `scripts/fix-price-answers.js` sửa lỗi các câu trả lời có giá hiển thị là `[object Object]` trong collection chatbotqas.

```bash
node scripts/fix-price-answers.js
```

### 2. Huấn luyện chatbot từ file Medicine.txt

Script `scripts/train-chatbot.js` phân tích dữ liệu từ file Medicine.txt và thêm vào collection chatbotqas.

```bash
node scripts/train-chatbot.js
```

## Danh mục câu hỏi

Hệ thống phân loại câu hỏi thành các danh mục sau:

- **price**: Câu hỏi về giá thuốc
- **dosage**: Câu hỏi về liều lượng
- **side-effects**: Câu hỏi về tác dụng phụ
- **contraindications**: Câu hỏi về chống chỉ định
- **interactions**: Câu hỏi về tương tác thuốc
- **description**: Câu hỏi về mô tả thuốc
- **composition**: Câu hỏi về thành phần
- **symptom**: Câu hỏi về triệu chứng
- **general**: Các câu hỏi chung khác

## API Endpoints

- **GET /api/chatbot/qa**: Lấy danh sách câu hỏi và câu trả lời
- **POST /api/chatbot/qa**: Thêm một cặp câu hỏi - câu trả lời mới
- **POST /api/chatbot/message**: Gửi một câu hỏi và nhận câu trả lời
- **POST /api/chatbot/parse-medicine-data**: Phân tích dữ liệu từ file Medicine.txt
- **POST /api/chatbot/import-database-data**: Nhập dữ liệu từ database

## Cách cải thiện độ chính xác

1. **Thêm nhiều câu hỏi và câu trả lời**: Càng nhiều dữ liệu, chatbot càng thông minh
2. **Cập nhật từ khóa và tên thuốc**: Đảm bảo các trường keywords và medicineTerms được điền đầy đủ
3. **Phân loại danh mục chính xác**: Giúp tìm kiếm hiệu quả hơn
4. **Sửa lỗi câu trả lời**: Sử dụng script fix-price-answers.js để sửa lỗi giá thuốc 