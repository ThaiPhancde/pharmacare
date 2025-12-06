#!/usr/bin/env node

/**
 * Script sửa lỗi "đồng đồng" trong câu trả lời giá thuốc
 */

import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Connection URL
const uri = "mongodb+srv://anthaiphanxuan:anthai8c@pharmacare.hdwbxsq.mongodb.net/pharmacare?retryWrites=true&w=majority&appName=PharmaCare";

// Sửa lỗi đồng đồng trong câu trả lời
async function fixDongDong() {
  const client = new MongoClient(uri);
  
  try {
    // Kết nối đến MongoDB
    await client.connect();
    console.log("Đã kết nối đến MongoDB");
    
    const db = client.db();
    
    // Tìm các câu trả lời có chứa "đồng đồng"
    const dongPattern = /đồng đồng/i;
    const dongDongAnswers = await db.collection('chatbotqas').find({
      answer: { $regex: dongPattern }
    }).toArray();
    
    console.log(`Đã tìm thấy ${dongDongAnswers.length} câu trả lời có lỗi "đồng đồng"`);
    
    // Sửa từng câu trả lời
    let updatedCount = 0;
    
    for (const qa of dongDongAnswers) {
      // Thay thế "đồng đồng" thành "đồng"
      const fixedAnswer = qa.answer.replace(/đồng đồng/g, "đồng");
      
      // Cập nhật câu trả lời trong DB
      const result = await db.collection('chatbotqas').updateOne(
        { _id: qa._id },
        { $set: { answer: fixedAnswer } }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`Đã sửa: "${qa.answer}" => "${fixedAnswer}"`);
      }
    }
    
    console.log(`\nĐã sửa thành công ${updatedCount}/${dongDongAnswers.length} câu trả lời có lỗi`);
    
    // Sửa lại hàm getMedicinePrice trong train-chatbot.js để tránh lỗi trong tương lai
    console.log("\nĐể tránh lỗi này trong tương lai, hãy kiểm tra hàm getMedicinePrice trong train-chatbot.js");
    console.log("Đảm bảo không thêm 'đồng' khi câu trả lời đã chứa từ này.");
    
  } catch (error) {
    console.error("Lỗi khi sửa lỗi đồng đồng:", error);
  } finally {
    await client.close();
    console.log("\nĐã đóng kết nối MongoDB");
  }
}

// Chạy hàm sửa lỗi
fixDongDong(); 