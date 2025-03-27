FROM node:20-alpine as build-stage

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép các file cấu hình package
COPY frontend/package.json frontend/yarn.lock ./

# Cài đặt dependencies
RUN yarn install --frozen-lockfile

# Sao chép toàn bộ source code frontend
COPY frontend/ ./

# Build ứng dụng
RUN yarn build

# Stage production
FROM node:20-alpine as production-stage

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép các file từ build stage
COPY --from=build-stage /app/.output /app/.output

# Thiết lập các biến môi trường
ENV NODE_ENV=production

# Mở port
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["node", ".output/server/index.mjs"] 