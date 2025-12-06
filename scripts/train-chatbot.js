#!/usr/bin/env node

/**
 * Script huấn luyện chatbot dựa trên dữ liệu từ file Medicine.txt
 * Phân tích dữ liệu và thêm vào collection chatbotqas
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB Connection URL
const uri = "mongodb+srv://anthaiphanxuan:anthai8c@pharmacare.hdwbxsq.mongodb.net/pharmacare?retryWrites=true&w=majority&appName=PharmaCare"; // Thay đổi nếu cần

// Hàm trích xuất tên thuốc từ văn bản
function extractMedicineTerms(text) {
  // Danh sách một số thuốc phổ biến để hỗ trợ nhận dạng
  const commonMedicines = [
    'paracetamol', 'brufen', 'aspirin', 'ibuprofen', 'amoxicillin',
    'panadol', 'efferalgan', 'tylenol', 'hapacol', 'para', 
    'zithromax', 'nexium', 'simlo', 'hasrax', 'ventolin',
    'upsa c', 'cortone', 'fugacar', 'motilium', 'lorfast'
  ];
  
  const medicineMatches = [];
  
  // Biểu thức chính quy tìm tên thuốc
  const medicineRegex = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  medicineMatches.push(...matches);
  
  // Tìm các tên thuốc phổ biến trong văn bản
  for (const medicine of commonMedicines) {
    const regex = new RegExp(`\\b${medicine}\\b`, 'i');
    if (regex.test(text.toLowerCase())) {
      medicineMatches.push(medicine.toLowerCase());
    }
  }
  
  // Lọc ra các tên thuốc duy nhất
  return [...new Set(medicineMatches)];
}

// Hàm trích xuất từ khóa từ văn bản
function extractKeywords(text) {
  // Vietnamese stopwords list
  const stopwords = [
    'và', 'hoặc', 'là', 'có', 'những', 'các', 'của', 'cho', 'trong', 'với', 
    'không', 'được', 'cần', 'phải', 'này', 'nào', 'một', 'còn', 'thì',
    'khi', 'nếu', 'mà', 'để', 'từ', 'theo', 'đến', 'qua', 'gì'
  ];
  
  // Remove punctuation and split into words
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Filter out stopwords and words that are too short
  return [...new Set(words)]
    .filter(word => word.length > 2 && !stopwords.includes(word));
}

// Hàm xác định danh mục dựa trên nội dung câu hỏi
function detectCategory(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('liều') || lowerQuestion.includes('lượng') || lowerQuestion.includes('uống')) {
    return 'dosage';
  } else if (lowerQuestion.includes('tác dụng phụ') || lowerQuestion.includes('phản ứng')) {
    return 'side-effects';
  } else if (lowerQuestion.includes('chống chỉ định') || lowerQuestion.includes('bệnh nền')) {
    return 'contraindications';
  } else if (lowerQuestion.includes('tương tác')) {
    return 'interactions';
  } else if (lowerQuestion.includes('giá')) {
    return 'price';
  } else if (lowerQuestion.includes('là thuốc') || lowerQuestion.includes('làm gì') || lowerQuestion.includes('tác dụng')) {
    return 'description';
  } else if (lowerQuestion.includes('hoạt chất') || lowerQuestion.includes('thành phần')) {
    return 'composition';
  } else if (lowerQuestion.includes('đau') || lowerQuestion.includes('sốt') || lowerQuestion.includes('ho') ||
            lowerQuestion.includes('tiêu chảy') || lowerQuestion.includes('buồn nôn') || lowerQuestion.includes('dị ứng')) {
    return 'symptom';
  } else {
    return 'general';
  }
}

// Hàm đọc và phân tích file Medicine.txt
async function parseMedicineTxt() {
  try {
    // Đọc file Medicine.txt
    const filePath = path.resolve(process.cwd(), 'Medicine.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const qaPairs = [];
    
    // Phân tích nội dung file
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Bỏ qua dòng trống
      if (!line) continue;
      
      // Kiểm tra xem đây có phải là dòng chứa câu hỏi hay không (kết thúc bằng dấu ?)
      if (line.includes('?')) {
        const question = line;
        let answer = '';
        
        // Thu thập câu trả lời từ các dòng tiếp theo cho đến khi gặp dòng trống hoặc câu hỏi khác
        let j = i + 1;
        while (j < lines.length) {
          const answerLine = lines[j].trim();
          
          // Nếu gặp câu hỏi khác hoặc dòng trống sau khi đã có câu trả lời, dừng lại
          if ((answerLine.includes('?') && answer) || !answerLine) {
            break;
          }
          
          // Thêm vào câu trả lời với khoảng cách giữa các dòng
          if (answer && answerLine) answer += ' ';
          if (answerLine) answer += answerLine;
          
          j++;
        }
        
        // Chỉ thêm vào nếu có cả câu hỏi và câu trả lời
        if (question && answer) {
          // Trích xuất tên thuốc từ câu hỏi
          const medicineTerms = extractMedicineTerms(question);
          
          // Trích xuất từ khóa
          const keywords = extractKeywords(question + " " + answer);
          
          // Phát hiện danh mục dựa trên nội dung
          const category = detectCategory(question);
          
          qaPairs.push({
            question,
            answer,
            category,
            keywords: keywords.join(' '),
            medicineTerms: medicineTerms.join(' ')
          });
          
          // Bỏ qua các dòng đã xử lý
          i = j - 1;
        }
      }
    }
    
    return qaPairs;
  } catch (error) {
    console.error('Lỗi khi đọc file Medicine.txt:', error);
    return [];
  }
}

// Hàm để lấy giá thuốc từ collection medicines
async function getMedicinePrice(db, medicineName) {
  try {
    const medicine = await db.collection('medicines').findOne({ 
      name: { $regex: new RegExp(`${medicineName}`, 'i') } 
    });
    
    if (medicine && medicine.price) {
      // Chỉ trả về giá, không thêm "đồng" ở đây để tránh bị trùng lặp
      return medicine.price.toLocaleString('vi-VN');
    } else {
      return "không có thông tin giá";
    }
  } catch (error) {
    console.error(`Lỗi khi lấy giá thuốc ${medicineName}:`, error);
    return "không có thông tin giá";
  }
}

// Hàm cập nhật câu trả lời giá thuốc
async function updatePriceAnswers(db, qaPairs) {
  for (const qa of qaPairs) {
    // Chỉ xử lý câu hỏi liên quan đến giá
    if (qa.category === 'price' && qa.medicineTerms) {
      const medicineName = qa.medicineTerms.split(' ')[0]; // Lấy tên thuốc đầu tiên
      if (medicineName) {
        const price = await getMedicinePrice(db, medicineName);
        // Kiểm tra câu trả lời đã có từ "đồng" chưa
        if (qa.answer.includes("đồng")) {
          // Nếu đã có, chỉ cần thay thế [object Object] bằng giá
          qa.answer = qa.answer.replace(/\[object Object\]/g, price);
        } else {
          // Nếu chưa có, thêm "đồng" vào sau giá
          qa.answer = qa.answer.replace(/\[object Object\]/g, price + " đồng");
        }
      }
    }
  }
  return qaPairs;
}

// Hàm huấn luyện chatbot
async function trainChatbot() {
  const client = new MongoClient(uri);
  
  try {
    // Kết nối đến MongoDB
    await client.connect();
    console.log("Đã kết nối đến MongoDB");
    
    const db = client.db();
    
    // Phân tích dữ liệu từ file Medicine.txt
    console.log("Đang phân tích dữ liệu từ Medicine.txt...");
    let qaPairs = await parseMedicineTxt();
    
    if (qaPairs.length === 0) {
      console.error('Không tìm thấy cặp Q&A nào trong file Medicine.txt hoặc file không tồn tại.');
      return;
    }
    
    console.log(`Đã phát hiện ${qaPairs.length} cặp Q&A từ file Medicine.txt.`);
    
    // Cập nhật câu trả lời giá thuốc
    console.log("Đang cập nhật giá thuốc từ database...");
    qaPairs = await updatePriceAnswers(db, qaPairs);
    
    // Đếm số lượng QA theo danh mục
    const categoryCounts = qaPairs.reduce((counts, qa) => {
      const category = qa.category || 'uncategorized';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    
    console.log('Phân loại theo danh mục:', categoryCounts);
    
    // Thêm từng cặp Q&A vào database
    console.log("Đang thêm dữ liệu vào database...");
    let successCount = 0;
    let errorCount = 0;
    
    // Xóa dữ liệu cũ (tùy chọn)
    const deleteResult = await db.collection('chatbotqas').deleteMany({});
    console.log(`Đã xóa ${deleteResult.deletedCount} mục dữ liệu cũ.`);
    
    // Thêm dữ liệu mới
    for (const pair of qaPairs) {
      try {
        const result = await db.collection('chatbotqas').insertOne(pair);
        
        if (result.insertedId) {
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`Đã thêm ${successCount}/${qaPairs.length} cặp Q&A...`);
          }
        } else {
          errorCount++;
          console.error(`Lỗi khi thêm "${pair.question.substring(0, 30)}..."`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Lỗi khi thêm "${pair.question.substring(0, 30)}...":`, error.message);
      }
    }
    
    console.log(`Đã hoàn thành import ${successCount}/${qaPairs.length} cặp Q&A! (Lỗi: ${errorCount})`);
  } catch (error) {
    console.error('Lỗi khi huấn luyện chatbot:', error);
  } finally {
    await client.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

// Chạy hàm huấn luyện
trainChatbot(); 