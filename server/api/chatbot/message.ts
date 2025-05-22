import { ChatbotQA, Medicine, Supplier, Category, Stock, Invoice, TypeMedicine, Unit } from '~/server/models';
import mongoose from 'mongoose';

// Mở rộng kiểu cho ChatbotQA model để hỗ trợ phương thức findSimilar
interface ChatbotQAModel extends mongoose.Model<any> {
  findSimilar(query: string, limit?: number): Promise<any[]>;
}

// Hàm trợ giúp phát hiện danh mục dựa trên nội dung
function detectCategory(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Logic phát hiện danh mục
  if (/liều\s+lượng|dùng\s+bao\s+nhiêu|uống\s+như\s+thế\s+nào/.test(lowerText)) {
    return 'dosage';
  } else if (/tác\s+dụng\s+phụ|phản\s+ứng|tác\s+hại/.test(lowerText)) {
    return 'side-effects';
  } else if (/chống\s+chỉ\s+định|không\s+nên\s+dùng|bệnh\s+nền/.test(lowerText)) {
    return 'contraindications';
  } else if (/tương\s+tác|tương\s+tác\s+với|kết\s+hợp/.test(lowerText)) {
    return 'interactions';
  } else if (/giá|giá\s+bao\s+nhiêu|bao\s+nhiêu\s+tiền|mua\s+với\s+giá|giá\s+thuốc|có\s+giá|giá\s+là|chi\s+phí/.test(lowerText)) {
    return 'price';
  } else if (/thống\s+kê|bao\s+nhiêu|số\s+lượng|tổng\s+cộng|tổng\s+số/.test(lowerText)) {
    return 'statistics';
  }
  
  return null;
}

// Hàm trợ giúp escape các ký tự đặc biệt trong regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Hàm trợ giúp trích xuất tên thuốc
function extractMedicineNames(text: string): string[] {
  // Danh sách một số thuốc phổ biến để hỗ trợ nhận dạng
  const commonMedicines = [
    'paracetamol', 'brufen', 'aspirin', 'ibuprofen', 'amoxicillin',
    'panadol', 'efferalgan', 'tylenol', 'hapacol', 'para', 
    'thuốc giảm đau', 'thuốc hạ sốt', 'kháng sinh'
  ];
  
  const medicineMatches: string[] = [];
  
  // Biểu thức chính quy tìm tên thuốc
  const medicineRegex = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  medicineMatches.push(...matches);
  
  // Tìm các tên thuốc phổ biến trong văn bản
  for (const medicine of commonMedicines) {
    const regex = new RegExp(`\\b${escapeRegExp(medicine)}\\b`, 'i');
    if (regex.test(text.toLowerCase())) {
      medicineMatches.push(medicine.toLowerCase());
    }
  }
  
  return [...new Set(medicineMatches)];
}

// Hàm xử lý câu hỏi về giá thuốc
async function handlePriceQuestion(message: string) {
  try {
    // Trích xuất tên thuốc từ câu hỏi
    const medicineNames = extractMedicineNames(message);
    
    if (medicineNames.length > 0) {
      const medicineName = medicineNames[0];
      
      // Truy vấn trực tiếp collection medicines
      const medicine = await Medicine.findOne({
        name: { $regex: new RegExp(medicineName, 'i') }
      });
      
      if (medicine && medicine.price) {
        return {
          success: true,
          data: {
            answer: `${medicine.name} có giá ${medicine.price.toLocaleString('vi-VN')} đồng.`,
            source: 'database-direct'
          }
        };
      }
    }
    return null; // Không tìm thấy thuốc hoặc không có giá
  } catch (error) {
    console.error('Error handling price question:', error);
    return null;
  }
}

// Hàm xử lý câu hỏi về thống kê
async function handleStatsQuestion(message: string) {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Thống kê về nhà cung cấp
    if (lowerMessage.includes('nhà cung cấp') || lowerMessage.includes('supplier')) {
      if (lowerMessage.includes('bao nhiêu') || lowerMessage.includes('số lượng')) {
        const count = await Supplier.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hiện tại hệ thống có ${count} nhà cung cấp thuốc.`,
            source: 'database-direct'
          }
        };
      }
    }
    
    // Thống kê về thuốc
    if (lowerMessage.includes('loại thuốc') || lowerMessage.includes('medicine')) {
      if (lowerMessage.includes('bao nhiêu') || lowerMessage.includes('số lượng')) {
        const count = await Medicine.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hiện tại hệ thống có ${count} loại thuốc.`,
            source: 'database-direct'
          }
        };
      }
    }
    
    // Thống kê theo danh mục
    const categoryMatch = lowerMessage.match(/thuốc (.*?) có bao nhiêu/i);
    if (categoryMatch && categoryMatch[1]) {
      const categoryName = categoryMatch[1];
      const category = await Category.findOne({
        name: { $regex: new RegExp(categoryName, 'i') }
      });
      
      if (category) {
        const count = await Medicine.countDocuments({ category_id: category._id });
        return {
          success: true,
          data: {
            answer: `Hiện tại hệ thống có ${count} loại thuốc ${categoryName}.`,
            source: 'database-direct'
          }
        };
      }
    }

    // Thống kê về hóa đơn
    if (lowerMessage.includes('hóa đơn') || lowerMessage.includes('invoice')) {
      if (lowerMessage.includes('bao nhiêu') || lowerMessage.includes('số lượng')) {
        const count = await Invoice.countDocuments({});
        return {
          success: true,
          data: {
            answer: `Hiện tại hệ thống có ${count} hóa đơn.`,
            source: 'database-direct'
          }
        };
      }
    }
    
    return null; // Không phải câu hỏi thống kê hoặc không xử lý được
  } catch (error) {
    console.error('Error handling stats question:', error);
    return null;
  }
}

// Hàm xử lý câu hỏi về tồn kho thuốc
async function handleStockQuestion(message: string) {
  try {
    // Trích xuất tên thuốc từ câu hỏi
    const medicineNames = extractMedicineNames(message);
    const lowerMessage = message.toLowerCase();
    
    if (medicineNames.length > 0 && (lowerMessage.includes('còn') || lowerMessage.includes('tồn kho') || lowerMessage.includes('số lượng'))) {
      const medicineName = medicineNames[0];
      
      // Tìm thuốc
      const medicine = await Medicine.findOne({
        name: { $regex: new RegExp(medicineName, 'i') }
      });
      
      if (medicine) {
        // Tìm thông tin tồn kho
        const stock = await Stock.findOne({ medicine_id: medicine._id });
        
        // Lấy thông tin đơn vị
        let unitName = 'đơn vị';
        if (medicine.unit_id) {
          const unit = await Unit.findById(medicine.unit_id);
          if (unit) unitName = unit.name;
        }
        
        const quantity = stock ? stock.quantity : 0;
        return {
          success: true,
          data: {
            answer: `${medicine.name} hiện còn ${quantity} ${unitName} trong kho.`,
            source: 'database-direct'
          }
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error handling stock question:', error);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { message } = body;
    
    if (!message) {
      return { success: false, message: 'User message is required' };
    }
    
    console.log(`Processing query: "${message}"`);
    
    // 1. Xử lý câu hỏi về giá thuốc
    if (detectCategory(message) === 'price') {
      const priceResponse = await handlePriceQuestion(message);
      if (priceResponse) {
        console.log('Trả lời câu hỏi về giá từ database trực tiếp');
        return priceResponse;
      }
    }
    
    // 2. Xử lý câu hỏi về thống kê
    if (detectCategory(message) === 'statistics') {
      const statsResponse = await handleStatsQuestion(message);
      if (statsResponse) {
        console.log('Trả lời câu hỏi thống kê từ database trực tiếp');
        return statsResponse;
      }
    }
    
    // 3. Xử lý câu hỏi về tồn kho
    const stockResponse = await handleStockQuestion(message);
    if (stockResponse) {
      console.log('Trả lời câu hỏi về tồn kho từ database trực tiếp');
      return stockResponse;
    }
    
    // First try to find a direct match in our database
    const exactMatch = await ChatbotQA.findOne({
      question: { $regex: new RegExp(`^${message.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    
    if (exactMatch) {
      console.log(`Found exact match: "${exactMatch.question}"`);
      return {
        success: true,
        data: {
          answer: exactMatch.answer,
          source: 'database'
        }
      };
    }
    
    // Try to find similar questions using the new findSimilar method
    try {
      // Lấy model với kiểu được mở rộng
      const ChatbotQAWithMethods = ChatbotQA as ChatbotQAModel;
      
      // Tìm kiếm câu hỏi tương tự
      const similarQuestions = await ChatbotQAWithMethods.findSimilar(message, 5);
      
      // Debug - log thông tin tìm kiếm
      console.log(`Found ${similarQuestions.length} similar questions`);
      if (similarQuestions.length > 0) {
        console.log(`Top result: "${similarQuestions[0].question}" with score ${similarQuestions[0].searchScore}`);
        if (similarQuestions[0].category) {
          console.log(`Category: ${similarQuestions[0].category}`);
        }
        
        // Log all results for debugging
        similarQuestions.forEach((q, idx) => {
          if (idx < 3) { // Log only top 3 results to avoid clutter
            console.log(`Result ${idx+1}: "${q.question}" (score: ${q.searchScore}, category: ${q.category || 'none'})`);
          }
        });
      }
      
      // Nếu có kết quả và điểm tìm kiếm > 0
      if (similarQuestions.length > 0 && similarQuestions[0].searchScore > 0) {
        return {
          success: true,
          data: {
            answer: similarQuestions[0].answer,
            source: 'database'
          }
        };
      }
      
      // Không tìm thấy kết quả phù hợp
      console.log('No similar questions found with sufficient score');
    } catch (searchError: unknown) {
      const error = searchError as Error;
      console.log('Search error:', error.message);
      // Tiếp tục với Gemini API nếu tìm kiếm thất bại
    }
    
    // If no matches in database, use Gemini API
    try {
      const apiKey = 'AIzaSyA8CSwRjVF7ZES5Blg3KOlZc0eO7UyNdmA';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      // Enhance context with medicine information
      const context = `You are PharmaCare Assistant, a helpful chatbot specializing in medicine and pharmacy information. Provide concise, accurate responses in Vietnamese. If you don't know the answer, kindly say so rather than making up information.

      When answering about medicines:
      - Focus on being helpful, clear, and accurate
      - When discussing dosages, always note that a doctor should be consulted
      - Use clear, simple language
      - For questions about prices, side effects, contraindications, etc., provide factual information if you know it
      - Always respond in Vietnamese language
      `;
      
      // Kết hợp với dữ liệu từ DB để cung cấp ngữ cảnh cho Gemini
      const allQuestions = await ChatbotQA.find({}).limit(5);
      let additionalContext = "";
      
      if (allQuestions.length > 0) {
        additionalContext = "\n\nHere are some example Q&As from our database that might be helpful:\n";
        allQuestions.forEach((qa, index) => {
          additionalContext += `${index + 1}. Q: ${qa.question}\nA: ${qa.answer}\n\n`;
        });
      }
      
      // Tạo tài liệu tham chiếu cho Gemini
      const fullContext = context + additionalContext;
      
      const response = await $fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${fullContext}\n\nUser question: ${message}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      });
      
      // Type guard với unknown
      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string
            }>
          }
        }>
      }
      
      const responseData = response as GeminiResponse;
      
      if (
        responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts && 
        responseData.candidates[0].content.parts[0] &&
        typeof responseData.candidates[0].content.parts[0].text === 'string'
      ) {
        const answer = responseData.candidates[0].content.parts[0].text;
        return {
          success: true,
          data: {
            answer,
            source: 'gemini'
          }
        };
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (apiError: unknown) {
      const error = apiError as Error;
      console.error('Gemini API error:', error);
      return {
        success: true,
        data: {
          answer: 'Xin lỗi, tôi không thể trả lời câu hỏi này vào lúc này. Vui lòng thử lại hoặc liên hệ với dược sĩ để được hỗ trợ.',
          source: 'fallback'
        }
      };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Chatbot message error:', err);
    return { success: false, message: err.message || 'Đã xảy ra lỗi khi xử lý yêu cầu của bạn' };
  }
}); 