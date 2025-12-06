#!/usr/bin/env node

/**
 * Script kiểm tra và xóa câu hỏi trùng lặp trong collection chatbotqas
 */

import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Connection URL
const uri = "mongodb+srv://anthaiphanxuan:anthai8c@pharmacare.hdwbxsq.mongodb.net/pharmacare?retryWrites=true&w=majority&appName=PharmaCare";

// Function để chuẩn hóa câu hỏi
function normalizeQuestion(question) {
  return question
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,?!;:'"()]/g, '')
    .trim();
}

// Function tính độ tương đồng giữa hai chuỗi (sử dụng Levenshtein distance)
function calculateSimilarity(str1, str2) {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  const distance = track[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  
  // Tính độ tương đồng (0-1, 1 là giống hệt nhau)
  return maxLength ? 1 - distance / maxLength : 1;
}

// Kiểm tra câu hỏi trùng lặp
async function removeDuplicateQuestions() {
  const client = new MongoClient(uri);
  
  try {
    // Kết nối đến MongoDB
    await client.connect();
    console.log("Đã kết nối đến MongoDB");
    
    const db = client.db();
    
    // Lấy tất cả các câu hỏi từ collection chatbotqas
    const qaItems = await db.collection('chatbotqas').find({}).toArray();
    
    console.log(`Tổng số câu hỏi hiện có: ${qaItems.length}`);
    
    // Mảng lưu ID các câu hỏi trùng lặp cần xóa
    const duplicateIds = [];
    // Mảng lưu các câu hỏi đã được kiểm tra (đã chuẩn hóa)
    const processedQuestions = [];
    // Mảng lưu chi tiết các câu trùng lặp để hiển thị
    const duplicateDetails = [];
    
    // Kiểm tra từng câu hỏi
    for (let i = 0; i < qaItems.length; i++) {
      const currentQA = qaItems[i];
      const normalizedQuestion = normalizeQuestion(currentQA.question);
      
      // Kiểm tra xem câu hỏi này đã được xử lý chưa
      let isDuplicate = false;
      let similarityScore = 0;
      let originalQuestion = '';
      
      for (let j = 0; j < processedQuestions.length; j++) {
        const similarity = calculateSimilarity(normalizedQuestion, processedQuestions[j].normalized);
        
        // Nếu độ tương đồng >= 90%, coi là trùng lặp
        if (similarity >= 0.9) {
          isDuplicate = true;
          similarityScore = similarity;
          originalQuestion = processedQuestions[j].original;
          break;
        }
      }
      
      if (isDuplicate) {
        // Nếu là câu trùng lặp, thêm vào danh sách xóa
        duplicateIds.push(currentQA._id);
        duplicateDetails.push({
          original: originalQuestion,
          duplicate: currentQA.question,
          similarity: similarityScore.toFixed(2)
        });
      } else {
        // Nếu không phải trùng lặp, thêm vào danh sách đã xử lý
        processedQuestions.push({
          normalized: normalizedQuestion,
          original: currentQA.question
        });
      }
    }
    
    // Hiển thị các câu hỏi trùng lặp
    console.log(`\nĐã tìm thấy ${duplicateDetails.length} câu hỏi trùng lặp:`);
    duplicateDetails.forEach((item, index) => {
      console.log(`${index + 1}. Gốc: "${item.original}"`);
      console.log(`   Trùng lặp: "${item.duplicate}" (Độ tương đồng: ${item.similarity})`);
    });
    
    // Kiểm tra câu trả lời bị lặp "đồng đồng"
    console.log("\nKiểm tra câu trả lời có chứa 'đồng đồng':");
    const dongPattern = /đồng đồng/i;
    const dongDongAnswers = qaItems.filter(qa => dongPattern.test(qa.answer));
    
    dongDongAnswers.forEach((qa, i) => {
      console.log(`${i + 1}. Q: ${qa.question}`);
      console.log(`   A: ${qa.answer}`);
    });
    
    console.log(`\nTổng số câu trả lời chứa 'đồng đồng': ${dongDongAnswers.length}`);
    
    // Xóa các câu hỏi trùng lặp
    if (duplicateIds.length > 0) {
      const confirmDelete = true; // Trong script tự động, set mặc định là true
      
      if (confirmDelete) {
        const deleteResult = await db.collection('chatbotqas').deleteMany({
          _id: { $in: duplicateIds }
        });
        
        console.log(`\nĐã xóa ${deleteResult.deletedCount}/${duplicateIds.length} câu hỏi trùng lặp`);
      } else {
        console.log("\nĐã hủy thao tác xóa");
      }
    } else {
      console.log("\nKhông có câu hỏi trùng lặp cần xóa");
    }
    
  } catch (error) {
    console.error("Lỗi khi kiểm tra câu hỏi trùng lặp:", error);
  } finally {
    await client.close();
    console.log("\nĐã đóng kết nối MongoDB");
  }
}

// Chạy hàm kiểm tra
removeDuplicateQuestions(); 