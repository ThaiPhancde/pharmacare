import fs from 'fs';
import path from 'path';
import { ChatbotQA } from '~/server/models';

// Interface cho dữ liệu thuốc từ database
interface MedicineData {
  _id: {
    $oid: string;
  };
  name: string;
  description?: string;
  price?: number;
  generic?: string;
  bar_code?: string;
  category_id?: {
    $oid: string;
  };
  unit_id?: {
    $oid: string;
  };
  type_id?: {
    $oid: string;
  };
}

interface SupplierData {
  _id: {
    $oid: string;
  };
  name: string;
  address?: string;
  phone?: string;
  city?: string;
}

interface CategoryData {
  _id: {
    $oid: string;
  };
  name: string;
}

interface UnitData {
  _id: {
    $oid: string;
  };
  name: string;
}

interface TypeData {
  _id: {
    $oid: string;
  };
  name: string;
}

interface StockData {
  _id: {
    $oid: string;
  };
  medicine_id: {
    $oid: string;
  };
  quantity: number;
}

// Interface for QA pair
interface QAPair {
  question: string;
  answer: string;
  category?: string;
  keywords?: string;
  medicineTerms?: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Đảm bảo đây là POST request
    if (event.node.req.method !== 'POST') {
      return { success: false, message: 'This endpoint requires a POST request' };
    }

    // Thống kê số lượng câu hỏi đã import
    let totalFromDb = 0;
    let totalFromText = 0;

    // ------- BƯỚC 1: NHẬP DỮ LIỆU TỪ DATABASE -------
    // Đọc file dữ liệu từ database
    const medicineJsonPath = path.resolve(process.cwd(), 'database/pharmacare.medicines.json');
    const supplierJsonPath = path.resolve(process.cwd(), 'database/pharmacare.suppliers.json');
    const categoryJsonPath = path.resolve(process.cwd(), 'database/pharmacare.categories.json');
    const unitJsonPath = path.resolve(process.cwd(), 'database/pharmacare.units.json');
    const typeJsonPath = path.resolve(process.cwd(), 'database/pharmacare.typemedicines.json');
    const stockJsonPath = path.resolve(process.cwd(), 'database/pharmacare.stocks.json');

    // Đọc dữ liệu từ các file JSON
    let medicines: MedicineData[] = [];
    let suppliers: SupplierData[] = [];
    let categories: CategoryData[] = [];
    let units: UnitData[] = [];
    let types: TypeData[] = [];
    let stocks: StockData[] = [];

    try {
      if (fs.existsSync(medicineJsonPath)) {
        medicines = JSON.parse(fs.readFileSync(medicineJsonPath, 'utf-8'));
      }
      
      if (fs.existsSync(supplierJsonPath)) {
        suppliers = JSON.parse(fs.readFileSync(supplierJsonPath, 'utf-8'));
      }
      
      if (fs.existsSync(categoryJsonPath)) {
        categories = JSON.parse(fs.readFileSync(categoryJsonPath, 'utf-8'));
      }
      
      if (fs.existsSync(unitJsonPath)) {
        units = JSON.parse(fs.readFileSync(unitJsonPath, 'utf-8'));
      }
      
      if (fs.existsSync(typeJsonPath)) {
        types = JSON.parse(fs.readFileSync(typeJsonPath, 'utf-8'));
      }
      
      if (fs.existsSync(stockJsonPath)) {
        stocks = JSON.parse(fs.readFileSync(stockJsonPath, 'utf-8'));
      }
    } catch (error) {
      console.error("Error reading database files:", error);
    }

    console.log(`Loaded ${medicines.length} medicines, ${categories.length} categories, ${stocks.length} stock items`);

    // Tạo lookup maps để truy vấn nhanh
    const categoryMap = new Map(categories.map(cat => [cat._id.$oid, cat.name]));
    const unitMap = new Map(units.map(unit => [unit._id.$oid, unit.name]));
    const typeMap = new Map(types.map(type => [type._id.$oid, type.name]));
    const stockMap = new Map();

    // Xây dựng map cho tồn kho
    stocks.forEach(stock => {
      if (stock.medicine_id && stock.medicine_id.$oid) {
        stockMap.set(stock.medicine_id.$oid, stock.quantity);
      }
    });

    // Mảng để lưu các cặp Q&A tạo ra
    const qaDataFromDb: QAPair[] = [];

    // Mảng các template câu hỏi - trả lời khác nhau
    const questionTemplates = [
      {
        type: 'price',
        questions: [
          "$medicine có giá bao nhiêu?", 
          "$medicine có giá là bao nhiêu?", 
          "Giá của $medicine là bao nhiêu?",
          "$medicine bao nhiêu tiền?",
          "Cho hỏi giá $medicine"
        ],
        answerTemplate: "$medicine có giá $price."
      },
      {
        type: 'description',
        questions: [
          "$medicine là thuốc gì?", 
          "$medicine dùng để làm gì?",
          "$medicine có tác dụng gì?",
          "Công dụng của $medicine là gì?"
        ],
        answerTemplate: "$medicine là thuốc $description. Thuộc nhóm $category, dạng $unit."
      },
      {
        type: 'composition',
        questions: [
          "$medicine chứa hoạt chất gì?",
          "$medicine có thành phần gì?",
          "Hoạt chất của $medicine là gì?",
          "Thành phần chính trong $medicine là gì?"
        ],
        answerTemplate: "$medicine chứa hoạt chất $generic."
      },
      {
        type: 'inventory',
        questions: [
          "$medicine còn bao nhiêu trong kho?",
          "$medicine còn hàng không?",
          "Hiệu thuốc còn $medicine không?",
          "Số lượng $medicine hiện có là bao nhiêu?"
        ],
        answerTemplate: "$medicine hiện còn $quantity $unit trong kho."
      },
      {
        type: 'prescription',
        questions: [
          "$medicine có cần kê đơn không?",
          "$medicine có cần đơn bác sĩ không?",
          "$medicine có thể mua tự do không?",
          "Có thể mua $medicine không cần đơn thuốc không?"
        ],
        answerTemplate: "$medicine là thuốc $prescriptionStatus"
      }
    ];

    // ------- BƯỚC 2: TẠO CÁC TEMPLATE CÂU HỎI VÀ TRẢ LỜI -------
    // Duyệt qua từng loại thuốc để tạo cặp câu hỏi-trả lời
    for (const medicine of medicines) {
      const medicineName = medicine.name;
      const medicineId = medicine._id.$oid;
      const price = medicine.price ? `${medicine.price.toLocaleString('vi-VN')} đồng` : 'không có thông tin giá';
      const description = medicine.description || 'không có mô tả';
      const generic = medicine.generic || 'không có thông tin hoạt chất';
      const category = medicine.category_id && medicine.category_id.$oid 
        ? categoryMap.get(medicine.category_id.$oid) || 'không xác định' 
        : 'không xác định';
      const unit = medicine.unit_id && medicine.unit_id.$oid 
        ? unitMap.get(medicine.unit_id.$oid) || 'không xác định'
        : 'viên';
      const type = medicine.type_id && medicine.type_id.$oid 
        ? typeMap.get(medicine.type_id.$oid) || 'không xác định'
        : 'không xác định';
      const quantity = stockMap.has(medicineId) ? stockMap.get(medicineId) : 0;
      
      const prescriptionStatus = type === 'Prescription'
        ? 'kê đơn, cần có đơn bác sĩ khi mua.'
        : 'không kê đơn, có thể mua trực tiếp tại hiệu thuốc.';

      // Tạo nhiều câu hỏi khác nhau cho mỗi loại thuốc
      questionTemplates.forEach(template => {
        // Chọn ngẫu nhiên một câu hỏi từ mẫu câu hỏi
        const questionTemplate = template.questions[Math.floor(Math.random() * template.questions.length)];
        
        // Thay thế các placeholder trong câu hỏi và câu trả lời
        const question = questionTemplate.replace(/\$medicine/g, medicineName);
        let answer = template.answerTemplate.replace(/\$medicine/g, medicineName);
        
        // Thay thế các placeholder khác tùy theo loại câu hỏi
        switch(template.type) {
          case 'price':
            answer = answer.replace(/\$price/g, price);
            break;
          case 'description':
            answer = answer.replace(/\$description/g, description)
                          .replace(/\$category/g, category)
                          .replace(/\$unit/g, unit);
            break;
          case 'composition':
            answer = answer.replace(/\$generic/g, generic);
            break;
          case 'inventory':
            answer = answer.replace(/\$quantity/g, quantity.toString())
                          .replace(/\$unit/g, unit);
            break;
          case 'prescription':
            answer = answer.replace(/\$prescriptionStatus/g, prescriptionStatus);
            break;
        }

        // Thêm cặp Q&A vào mảng kết quả
        qaDataFromDb.push({
          question,
          answer,
          category: template.type,
          keywords: `${medicineName} ${template.type}`,
          medicineTerms: medicineName
        });
        
        // Tạo thêm các biến thể câu hỏi khác cho thuốc này
        template.questions.forEach(q => {
          if (q !== questionTemplate) { // Tránh trùng lặp với câu hỏi đã tạo
            const variantQuestion = q.replace(/\$medicine/g, medicineName);
            qaDataFromDb.push({
              question: variantQuestion,
              answer,
              category: template.type,
              keywords: `${medicineName} ${template.type}`,
              medicineTerms: medicineName
            });
          }
        });
      });
    }

    totalFromDb = qaDataFromDb.length;
    console.log(`Created ${totalFromDb} QA pairs from database`);

    // ------- BƯỚC 3: LẤY DỮ LIỆU TỪ MEDICINE.TXT -------
    // Đọc Medicine.txt cho các thông tin thuốc chi tiết
    const filePath = path.resolve(process.cwd(), 'Medicine.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const qaDataFromText: QAPair[] = [];
    
    // Parse the file content - sử dụng parser cải tiến
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this is a question
      if (line.includes('?')) {
        const question = line;
        let answer = '';
        
        // Next lines should be the answer - collect until empty line or next question
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && !lines[j].trim().includes('?')) {
          if (answer) answer += ' ';
          answer += lines[j].trim();
          j++;
        }
        
        // Only proceed if there's an actual answer
        if (answer) {
          // Extract medicine terms from question
          const medicineTerms = extractMedicineTerms(question);
          const keywords = extractKeywords(question + " " + answer);
          
          qaDataFromText.push({
            question,
            answer,
            category: detectCategory(question),
            keywords: keywords.join(' '),
            medicineTerms: medicineTerms.join(' ')
          });
          
          // Skip the lines we've just processed
          i = j - 1;
        }
      }
    }

    totalFromText = qaDataFromText.length;
    console.log(`Created ${totalFromText} QA pairs from Medicine.txt`);

    // ------- BƯỚC 4: THÊM DỮ LIỆU VÀO DATABASE -------
    // Xóa dữ liệu cũ nếu có
    await ChatbotQA.deleteMany({});
    
    // Kết hợp cả hai nguồn dữ liệu và thêm vào database
    const allQaPairs = [...qaDataFromDb, ...qaDataFromText];

    if (allQaPairs.length > 0) {
      await ChatbotQA.insertMany(allQaPairs);
      
      // Rebuild text index để đảm bảo nó khả dụng
      try {
        const db = ChatbotQA.db;
        const collection = db.collection('chatbotqas');
        
        // Drop existing indexes and recreate
        await collection.dropIndexes();
        await collection.createIndex({ 
          question: 'text', 
          answer: 'text', 
          keywords: 'text', 
          medicineTerms: 'text' 
        });
        
        console.log('Successfully rebuilt text index for chatbot search');
      } catch (indexError: any) {
        console.warn('Warning: Failed to rebuild text index:', indexError.message);
      }
      
      return { 
        success: true, 
        message: `Đã import thành công ${allQaPairs.length} câu hỏi và trả lời`,
        data: {
          fromDb: totalFromDb,
          fromText: totalFromText,
          total: allQaPairs.length
        }
      };
    } else {
      return { success: false, message: 'Không có câu hỏi nào được tạo ra' };
    }
  } catch (error: any) {
    console.error('Error importing database data:', error);
    return { success: false, message: error.message || 'Unknown error occurred' };
  }
});

// Helper function to detect category based on question content
function detectCategory(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('liều') || lowerQuestion.includes('lượng')) {
    return 'dosage';
  } else if (lowerQuestion.includes('tác dụng phụ') || lowerQuestion.includes('phản ứng')) {
    return 'side-effects';
  } else if (lowerQuestion.includes('chống chỉ định') || lowerQuestion.includes('bệnh nền')) {
    return 'contraindications';
  } else if (lowerQuestion.includes('tương tác')) {
    return 'interactions';
  } else if (lowerQuestion.includes('giá')) {
    return 'price';
  } else {
    return 'general';
  }
}

// Extract medicine terms from the document
function extractMedicineTerms(text: string): string[] {
  // Biểu thức chính quy tìm tên thuốc
  // Matches patterns like "Brufen 400mg", "Paracetamol", "Vitamin C", etc.
  const medicineRegex = /([A-Z][a-zÀ-ỹ]+(?:\s+[A-Z][a-zÀ-ỹ]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  
  // Filter to only unique terms
  return [...new Set(matches)];
}

// Extract keywords from a text
function extractKeywords(text: string): string[] {
  // Simple Vietnamese stopwords list
  const stopwords = ['và', 'hoặc', 'là', 'có', 'những', 'các', 'của', 'cho', 'trong', 'với', 'không', 'được', 'cần', 'phải'];
  
  // Remove punctuation and split into words
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Filter out stopwords and words that are too short
  return [...new Set(words)]
    .filter(word => word.length > 2 && !stopwords.includes(word));
} 