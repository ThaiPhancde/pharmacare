# 🚀 Hướng Dẫn Cài Đặt và Chạy PharmaCare

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: >= 18.x (khuyến nghị 20.x)
- **Yarn**: >= 1.22.x (hoặc pnpm, npm)
- **MongoDB**: Atlas hoặc Local >= 6.x
- **Git**: Để clone repository

## 🔧 Cài Đặt

### Bước 1: Clone Repository

```bash
git clone https://github.com/ThaiPhancde/pharmacare.git
cd pharmacare
```

### Bước 2: Cài Đặt Dependencies

```bash
# Sử dụng Yarn (khuyến nghị)
yarn install

# Hoặc pnpm
pnpm install

# Hoặc npm
npm install
```

### Bước 3: Cấu Hình Environment Variables

Tạo file `.env` từ template:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin của bạn:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/pharmacare

# JWT Secret
JWT_SECRET=your_secure_random_string_here

# GHN API (optional, cho chức năng shipping)
GHN_TOKEN=your_ghn_token
GHN_SHOP_ID=your_shop_id

# Gemini AI (optional, cho chatbot)
GEMINI_API_KEY=your_gemini_api_key
```

**⚠️ Lưu ý quan trọng:**
- File `.env` được ignore trong git, không được commit lên repository
- Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên phức tạp
- Nếu dùng MongoDB local: `MONGO_URI=mongodb://localhost:27017/pharmacare`

### Bước 4: Chuẩn Bị Database

#### Option 1: Sử dụng MongoDB Atlas (Cloud - Khuyến nghị)

1. Đăng ký tài khoản tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster miễn phí
3. Tạo database user và lấy connection string
4. Whitelist IP của bạn (hoặc cho phép all: 0.0.0.0/0)
5. Copy connection string vào `MONGODB_URI` trong file `.env`

#### Option 2: Sử dụng MongoDB Local

```bash
# Cài đặt MongoDB Community Edition
# Windows: Tải từ https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Khởi động MongoDB
mongod
```

#### Import Dữ Liệu Mẫu (Optional)

Nếu muốn import dữ liệu mẫu từ folder `database/`:

```bash
# Import từng collection
mongoimport --uri="your_mongodb_uri" --collection=medicines --file=database/pharmacare.medicines.json --jsonArray
mongoimport --uri="your_mongodb_uri" --collection=customers --file=database/pharmacare.customers.json --jsonArray
mongoimport --uri="your_mongodb_uri" --collection=suppliers --file=database/pharmacare.suppliers.json --jsonArray
# ... import các collection khác tương tự
```

## 🏃 Chạy Ứng Dụng

### Development Mode

```bash
yarn dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

### Production Build

```bash
# Build ứng dụng
yarn build

# Preview production build
yarn preview
```

### Chạy với Docker

#### Sử dụng Docker Compose (khuyến nghị)

```bash
# Build và start tất cả services (app + MongoDB)
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

**Lưu ý**: Docker compose sẽ tự động:
- Tạo MongoDB container với user `root` và password `thaian`
- Build và chạy PharmaCare app trên port 3000
- Kết nối app với MongoDB

#### Chạy Docker riêng lẻ

```bash
# Build image
docker build -t pharmacare .

# Run container (cần MongoDB riêng)
docker run -p 3000:3000 \
  -e MONGODB_URI="your_mongodb_uri" \
  -e JWT_SECRET="your_secret" \
  pharmacare
```

## 📦 Scripts Hữu Ích

### Chatbot Training

```bash
# Import dữ liệu chatbot từ database medicines
yarn chatbot:import

# Train chatbot từ file Medicine.txt
node scripts/train-chatbot.js

# Fix lỗi giá thuốc hiển thị [object Object]
node scripts/fix-price-answers.js

# Xóa câu hỏi trùng lặp
node scripts/remove-duplicate-questions.js
```

### Code Quality

```bash
# Lint code
yarn lint

# Format code
yarn format

# Type check
yarn typecheck
```

## 🔐 Tài Khoản Mặc Định

Nếu đã import dữ liệu mẫu, bạn có thể đăng nhập với:

- **Admin**: 
  - Email: `admin@pharmacare.com`
  - Password: `admin123`

- **User**:
  - Email: `user@pharmacare.com`
  - Password: `user123`

**⚠️ Khuyến nghị**: Thay đổi password ngay sau lần đăng nhập đầu tiên!

## 🚨 Xử Lý Lỗi Thường Gặp

### Lỗi: "MongoDB connection failed"

**Nguyên nhân**: Không kết nối được MongoDB

**Giải pháp**:
1. Kiểm tra `MONGODB_URI` trong `.env` có đúng không
2. Kiểm tra MongoDB service đang chạy (nếu dùng local)
3. Kiểm tra IP whitelist (nếu dùng Atlas)
4. Kiểm tra username/password có đúng không

### Lỗi: "Port 3000 already in use"

**Giải pháp**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Lỗi: "Cannot find module ..."

**Giải pháp**:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
rm yarn.lock  # hoặc package-lock.json
yarn install
```

### Lỗi: "Module not found: Can't resolve '@/components/...'"

**Giải pháp**:
```bash
# Rebuild Nuxt
rm -rf .nuxt
yarn dev
```

## 📂 Cấu Trúc File Quan Trọng

```
pharmacare/
├── .env                    # ⚠️ CẦN TẠO (không commit)
├── .env.example           # Template cho .env
├── nuxt.config.ts         # Cấu hình Nuxt
├── package.json           # Dependencies và scripts
├── server/
│   ├── api/              # API endpoints
│   ├── models/           # Mongoose schemas
│   └── plugins/
│       └── mongoose.ts   # Database connection
├── middleware/
│   └── auth.global.ts    # Authentication middleware
├── utils/
│   └── api.ts            # API utility functions
└── database/             # JSON seed data
```

## 🌐 Deploy lên Vercel

### Qua Vercel Dashboard

1. Push code lên GitHub
2. Truy cập [Vercel](https://vercel.com)
3. Import repository
4. Thêm Environment Variables (từ file `.env`)
5. Deploy!

### Qua Vercel CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

**⚠️ Quan trọng khi deploy Vercel:**
- Thêm tất cả environment variables trong Vercel dashboard
- MongoDB Atlas phải allow IP của Vercel (hoặc allow all: 0.0.0.0/0)
- Kiểm tra `nitro.preset: 'vercel'` trong `nuxt.config.ts`

## 📚 Tài Liệu Tham Khảo

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Shadcn-Vue Components](https://shadcn-vue.com/)
- [MongoDB Atlas Guide](https://www.mongodb.com/docs/atlas/)
- [GHN API Docs](docs/ghn-integration.md)
- [Chatbot Guide](README-CHATBOT.md)

## 🆘 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra [Issues](https://github.com/ThaiPhancde/pharmacare/issues)
2. Tạo issue mới với mô tả chi tiết
3. Liên hệ: dianpratama2@gmail.com

---

**Happy Coding! 🎉**
