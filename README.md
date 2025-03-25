# PharmaCare - Hệ thống quản lý hiệu thuốc

PharmaCare là ứng dụng quản lý hiệu thuốc toàn diện giúp quản lý khách hàng, thuốc, kho, hóa đơn, mua hàng và trả hàng.

## Tính năng

- **Dashboard**: Xem tổng quan về hoạt động kinh doanh
- **Khách hàng**: Quản lý thông tin khách hàng
- **Thuốc**: Quản lý danh mục thuốc
- **Mua hàng**: Quản lý nhập hàng từ nhà cung cấp
- **Hóa đơn**: Tạo và quản lý hóa đơn bán hàng
- **Trả hàng**: Quản lý đơn trả hàng
- **Kho**: Theo dõi tồn kho, thuốc hết hạn, thuốc sắp hết
- **Tài khoản ngân hàng**: Quản lý tài khoản ngân hàng

## Yêu cầu hệ thống

- Node.js >= 14.x
- MySQL >= 8.0

## Cài đặt

1. Clone repository
```
git clone <repository-url>
cd PharmaCare
```

2. Cài đặt các phụ thuộc
```
npm install
```

3. Thiết lập cơ sở dữ liệu
   - Tạo cơ sở dữ liệu MySQL
   - Nhập tệp `config/schema.sql` vào cơ sở dữ liệu
   
4. Cấu hình môi trường
   - Tạo tệp `.env` từ tệp `.env.example`
   - Điền thông tin cấu hình cơ sở dữ liệu

5. Khởi chạy ứng dụng
```
npm start
```

6. Truy cập ứng dụng tại: `http://localhost:3000`

## Thông tin đăng nhập mặc định

- **Email**: admin@gmail.com
- **Mật khẩu**: 123456

## Cấu trúc dự án

```
PharmaCare/
├── config/           # Cấu hình ứng dụng và cơ sở dữ liệu
├── controllers/      # Xử lý logic nghiệp vụ
├── models/           # Tương tác với cơ sở dữ liệu
├── public/           # Tài nguyên tĩnh (CSS, JS, hình ảnh)
├── routes/           # Định tuyến
├── views/            # Giao diện người dùng (EJS)
├── .env              # Biến môi trường
├── app.js            # Khởi động ứng dụng
└── package.json      # Quản lý phụ thuộc
```

## Hướng dẫn sử dụng

1. **Dashboard**: Xem tổng quan số liệu, báo cáo thu chi, thuốc bán chạy
2. **Khách hàng**: Thêm, sửa, xóa thông tin khách hàng
3. **Thuốc**: Quản lý danh mục thuốc và thông tin liên quan
4. **Mua hàng**: Tạo đơn nhập hàng từ nhà cung cấp
5. **Hóa đơn**: Tạo hóa đơn bán hàng cho khách
6. **Trả hàng**: Xử lý đơn trả hàng từ khách
7. **Kho**: Quản lý tồn kho, kiểm tra thuốc hết hạn
8. **Tài khoản ngân hàng**: Quản lý các tài khoản ngân hàng của cửa hàng 