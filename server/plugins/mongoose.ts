import mongoose from "mongoose";
import { H3Event } from 'h3';
import { Category, Unit, TypeMedicine, Supplier, Purchase, Medicine, Customer, Invoice, Stock, User } from "@/server/models";

let isConnected = false; // Cờ kiểm tra trạng thái kết nối

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig();
  // Đọc từ nhiều nguồn để đảm bảo backward compatibility
  const mongoUri = config.mongodbUri || 
                   config.mongoUri || 
                   process.env.MONGODB_URI || 
                   process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ MongoDB URI is not defined in environment variables or runtime config');
    console.error('Checked: config.mongodbUri, config.mongoUri, MONGODB_URI, MONGO_URI');
    return;
  }

  console.log('✅ MongoDB URI found, attempting to connect...');

  // Nếu đã kết nối rồi, không cần kết nối lại
  if (isConnected) {
    console.log('ℹ️  MongoDB already connected, skipping...');
    return;
  }

  mongoose.connect(mongoUri as string, {})
    .then(() => {
      console.log('🎉 MongoDB connected successfully!');
      mongoose.model('Unit', Unit.schema)
      mongoose.model('Category', Category.schema)
      mongoose.model('TypeMedicine', TypeMedicine.schema)
      mongoose.model('Supplier', Supplier.schema)
      mongoose.model('Purchase', Purchase.schema)
      mongoose.model('Medicine', Medicine.schema)
      mongoose.model('Customer', Customer.schema)
      mongoose.model('Invoice', Invoice.schema)
      mongoose.model('Stock', Stock.schema)
      mongoose.model('User', User.schema)
      isConnected = true; // Đánh dấu đã kết nối thành công
      console.log('✅ All models registered');
    })
    .catch(err => {
      console.error('❌ Failed to connect to MongoDB:', err.message);
    });
  
  // Đăng ký middleware để xử lý các lỗi MongoDB
  nitroApp.hooks.hook('request', (event: H3Event) => {
    // Handle MongoDB connection errors
    if (!isConnected) {
      console.warn('MongoDB connection is not established yet, but API was called');
    }
  });
});
