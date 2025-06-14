# Tích hợp Giao Hàng Nhanh (GHN) cho PharmaCare

Tài liệu này mô tả cách tích hợp Giao Hàng Nhanh (GHN) vào hệ thống PharmaCare để hỗ trợ vận chuyển thuốc cho khách hàng từ xa.

## Cấu hình GHN

Để sử dụng API của GHN, bạn cần phải có các thông tin sau:
- GHN API Token
- Shop ID (ID cửa hàng của bạn trong hệ thống GHN)

### Thiết lập cấu hình

1. Đăng ký tài khoản tại [GHN](https://ghn.vn)
2. Lấy API Token và Shop ID từ tài khoản GHN của bạn
3. Cập nhật file `.env` với các thông tin này:
```
GHN_TOKEN=your_ghn_token_here
GHN_SHOP_ID=your_ghn_shop_id_here
```

## Chức năng GHN được tích hợp

### 1. Tạo Đơn Vận Chuyển
- Tạo đơn hàng vận chuyển mới từ hóa đơn đã có
- Tự động tính phí vận chuyển
- Lấy thời gian dự kiến giao hàng

### 2. Tra Cứu Thông Tin Địa Chỉ
- Lấy danh sách tỉnh/thành phố
- Lấy danh sách quận/huyện theo tỉnh/thành phố
- Lấy danh sách phường/xã theo quận/huyện

### 3. Theo Dõi Đơn Hàng
- Truy vấn trạng thái đơn hàng theo mã vận đơn
- Hiển thị lịch sử trạng thái

## Quy trình tạo đơn vận chuyển

1. Đi đến trang chi tiết hóa đơn
2. Nhấn nút "Ship Order (GHN)"
3. Nhập thông tin người nhận và địa chỉ giao hàng
4. Chọn dịch vụ vận chuyển
5. Xác nhận và tạo đơn vận chuyển

## Tính năng đặc biệt cho thuốc

### Đặc điểm riêng khi vận chuyển thuốc
- Tự động thêm ghi chú "Đơn hàng thuốc - Xử lý cẩn thận"
- Yêu cầu KHÔNG CHO XEM HÀNG (KHONGCHOXEMHANG)
- Tính toán tự động trọng lượng dựa trên số lượng thuốc

## API Endpoints

### 1. Tính phí vận chuyển
```
POST /api/shipping/calculate-fee
```

### 2. Tạo đơn vận chuyển
```
POST /api/shipping
```

### 3. Lấy danh sách tỉnh/thành phố
```
GET /api/shipping/provinces
```

### 4. Lấy danh sách quận/huyện
```
GET /api/shipping/districts?province_id=X
```

### 5. Lấy danh sách phường/xã
```
GET /api/shipping/wards?district_id=X
```

### 6. Theo dõi đơn hàng
```
GET /api/shipping/track?order_code=X
```

## Thông tin kỹ thuật bổ sung

### GHN API
- API documentation: https://api.ghn.vn/home/docs
- Base URL: https://dev-online-gateway.ghn.vn/shiip/public-api/v2

### Mô hình dữ liệu
- Shipping Model: Lưu trữ thông tin về đơn giao hàng
- Kết nối với Invoice Model: Mỗi đơn vận chuyển liên kết với một hóa đơn 