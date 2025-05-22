#!/usr/bin/env node

/**
 * Script sửa lỗi các câu trả lời có giá [object Object] trong collection ChatbotQAs
 * Thay thế [object Object] bằng giá từ collection medicines
 */

import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Connection URL
const uri = "mongodb+srv://anthaiphanxuan:anthai8c@pharmacare.hdwbxsq.mongodb.net/pharmacare?retryWrites=true&w=majority&appName=PharmaCare"; // Thay đổi nếu cần

// Function để lấy giá thuốc từ tên thuốc
async function getMedicinePrice(db, medicineName) {
  try {
    const medicine = await db.collection('medicines').findOne({ 
      name: { $regex: new RegExp(`^${medicineName}$`, 'i') } 
    });
    
    if (medicine && medicine.price) {
      return medicine.price.toLocaleString('vi-VN');
    } else {
      return "không có thông tin";
    }
  } catch (error) {
    console.error(`Lỗi khi lấy giá thuốc ${medicineName}:`, error);
    return "không có thông tin";
  }
}

// Function để sửa các câu trả lời
async function fixPriceAnswers() {
  const client = new MongoClient(uri);
  
  try {
    // Kết nối đến MongoDB
    await client.connect();
    console.log("Đã kết nối đến MongoDB");
    
    const db = client.db();
    
    // Tìm các câu trả lời có chứa [object Object]
    const objectRegex = /\[object Object\]/; 
    const invalidAnswers = await db.collection('chatbotqas').find({
      answer: { $regex: objectRegex }
    }).toArray();
    
    console.log(`Đã tìm thấy ${invalidAnswers.length} câu trả lời có lỗi [object Object]`);
    
    // Phân tích câu trả lời để trích xuất tên thuốc
    let updatedCount = 0;
    
    for (const qaItem of invalidAnswers) {
      // Lấy tên thuốc từ câu hỏi hoặc medicineTerms
      let medicineName = qaItem.medicineTerms;
      
      if (!medicineName) {
        // Trích xuất tên thuốc từ câu hỏi nếu không có medicineTerms
        const questionWords = qaItem.question.split(' ');
        // Thuốc thường ở đầu câu hỏi
        medicineName = questionWords[0];
      }
      
      if (medicineName) {
        // Lấy giá thuốc từ collection medicines
        const price = await getMedicinePrice(db, medicineName);
        
        // Thay thế [object Object] bằng giá thuốc
        const fixedAnswer = qaItem.answer.replace(/\[object Object\]/g, price);
        
        // Cập nhật câu trả lời trong DB
        const result = await db.collection('chatbotqas').updateOne(
          { _id: qaItem._id },
          { $set: { answer: fixedAnswer } }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Đã sửa: ${qaItem.question} - "${qaItem.answer}" => "${fixedAnswer}"`);
        }
      }
    }
    
    console.log(`Đã sửa thành công ${updatedCount}/${invalidAnswers.length} câu trả lời có lỗi`);
  } catch (error) {
    console.error("Lỗi khi sửa câu trả lời:", error);
  } finally {
    await client.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

// Chạy hàm sửa lỗi
fixPriceAnswers(); 