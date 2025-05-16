import mongoose from "mongoose";
import { H3Event } from 'h3';

let isConnected = false; // Cờ kiểm tra trạng thái kết nối

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();
  const mongoUri = config.mongoUri || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MongoDB URI is not defined in environment variables or runtime config');
    return;
  }

  // Nếu đã kết nối rồi, không cần kết nối lại
  if (isConnected) return;

  mongoose.connect(mongoUri as string, {})
    .then(() => {
      console.log('✅ Connected to MongoDB');
      isConnected = true; // Đánh dấu đã kết nối thành công
    })
    .catch(err => {
      console.error('❌ Failed to connect to MongoDB', err);
    });
  
  // Đăng ký middleware để xử lý các lỗi MongoDB
  nitroApp.hooks.hook('request', (event: H3Event) => {
    // Handle MongoDB connection errors
    if (!isConnected) {
      console.warn('MongoDB connection is not established yet, but API was called');
    }
  });
});
