import mongoose from "mongoose";
import { Category, Unit, TypeMedicine } from "@/server/models";

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
      mongoose.model('Unit', Unit.schema)
      mongoose.model('Category', Category.schema)
      mongoose.model('TypeMedicine', TypeMedicine.schema)
      console.log('✅ Connected to MongoDB');
      isConnected = true; // Đánh dấu đã kết nối thành công
    })
    .catch(err => {
      console.error('❌ Failed to connect to MongoDB', err);
    });
});
