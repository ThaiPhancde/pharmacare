# PharmaCare

Hệ thống quản lý hiệu thuốc hiện đại với Node.js và MySQL.

## Cấu trúc dự án

Dự án được tổ chức thành các phần chính:

- **backend/**: Chứa tất cả mã nguồn phía backend
  - **config/**: Cấu hình cơ sở dữ liệu và ứng dụng
  - **controllers/**: Xử lý logic nghiệp vụ
  - **models/**: Tương tác với cơ sở dữ liệu
  - **routes/**: Định nghĩa API endpoints
  - **scripts/**: Script khởi tạo cơ sở dữ liệu
- **frontend/**: Chứa mã nguồn phía frontend (Nuxt.js, Vue.js, Tailwind CSS)

## Chức năng

Hệ thống PharmaCare bao gồm các chức năng:

1. Quản lý khách hàng
2. Quản lý thuốc
3. Quản lý hóa đơn 
4. Quản lý kho
5. Quản lý đơn hàng và trả hàng
6. Quản lý tài khoản ngân hàng
7. Dashboard hiển thị thông tin tổng quan

## Cài đặt

### Backend

Xem hướng dẫn chi tiết trong thư mục `backend/`.

### Frontend

```bash
# Di chuyển đến thư mục frontend
cd frontend

# Cài đặt dependencies
yarn install

# Khởi chạy môi trường development
yarn dev

# Build cho production
yarn build
```

## Deploy lên Vercel

Dự án đã được cấu hình sẵn để deploy lên Vercel.

### Sử dụng Docker

```bash
# Build Docker image
docker build -t pharmacare .

# Chạy Docker container
docker run -p 3000:3000 pharmacare
```

### Deploy trực tiếp lên Vercel

1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Vercel sẽ tự động phát hiện cấu hình trong file `vercel.json` và thiết lập build

Hoặc sử dụng Vercel CLI:

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel
``` 