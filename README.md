![nuxt-shadcn-dashboard-social-card](https://nuxt-shadcn-dashboard.vercel.app/social-card.png)

# PharmaCare

[![built with nuxt][nuxt-src]][nuxt-href]

- [Live demo](https://pharmacare-sigma.vercel.app)
- [Component Documentation](https://shadcn-vue.com/docs/introduction)

## MongoDB Atlas Integration

Dự án này đã tích hợp MongoDB Atlas cho cơ sở dữ liệu cloud.

- Tự động kết nối với MongoDB Atlas
- Xác thực bảo mật qua JWT
- Cập nhật lúc: ngày 15/11/2024

## Quick Start

```bash [Terminal]
npx degit dianprata/nuxt-shadcn-dashboard my-dashboard-app
cd my-dashboard-app
pnpm i # If you don't have pnpm installed, run: npm install -g pnpm
```

## Deploy lên Vercel

Dự án này đã có sẵn cấu hình để deploy lên Vercel.

### Sử dụng Docker

Nếu bạn muốn sử dụng Docker:

```bash [Terminal]
# Build Docker image
docker build -t pharmacare-frontend ./frontend

# Chạy Docker container
docker run -p 3000:3000 pharmacare-frontend
```

### Deploy trực tiếp lên Vercel

1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Vercel sẽ tự động phát hiện dự án Nuxt và thiết lập cấu hình build

Hoặc sử dụng Vercel CLI:

```bash [Terminal]
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Contributing

1. Clone this repository.
2. Install dependencies `pnpm install`.
3. Use `pnpm run dev` to start dev server.

## Credits

- [Nuxt.js](https://nuxtjs.org/)
- [Shadcn Vue](https://shadcn-vue.com/)
- [UnoCSS](https://unocss.com/)

## License

MIT

[nuxt-src]: https://img.shields.io/badge/Built%20With%20Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com/
