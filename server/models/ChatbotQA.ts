import mongoose, { Schema, Document } from "mongoose";

// Interface for ChatbotQA model
interface IChatbotQA extends Document {
  question: string;
  answer: string;
  category?: string;
  keywords?: string;
  medicineTerms?: string;
  searchScore?: number; // Trường mới để lưu điểm tìm kiếm (không lưu vào DB)
  createdAt?: Date;
  updatedAt?: Date;
}

// Type for search result with score
interface SearchResult extends IChatbotQA {
  searchScore?: number;
  _doc?: any; // For MongoDB document metadata
}

// ChatbotQA Schema definition
const ChatbotQASchema = new Schema<IChatbotQA>(
  {
    question: { type: String, required: true, index: true },
    answer: { type: String, required: true },
    category: { type: String, index: true },
    keywords: { type: String }, // Từ khóa trích xuất để cải thiện tìm kiếm
    medicineTerms: { type: String }, // Tên thuốc liên quan
  },
  { 
    timestamps: true 
  }
);

// Thêm text index cho tìm kiếm văn bản
ChatbotQASchema.index({ 
  question: 'text', 
  answer: 'text',
  keywords: 'text',
  medicineTerms: 'text'
}, {
  weights: {
    question: 10,   // Ưu tiên cao nhất cho câu hỏi
    medicineTerms: 5, // Ưu tiên thứ hai cho tên thuốc
    keywords: 3,    // Ưu tiên thứ ba cho từ khóa
    answer: 1       // Ưu tiên thấp nhất cho câu trả lời
  },
  name: "chatbot_search_index"
});

// Thêm các index thông thường để tối ưu truy vấn
ChatbotQASchema.index({ category: 1 });
ChatbotQASchema.index({ medicineTerms: 1 });

// Thêm method tìm kiếm tương tự cho model với thuật toán cải tiến
ChatbotQASchema.statics.findSimilar = async function(query: string, limit: number = 5): Promise<SearchResult[]> {
  console.log(`Finding similar questions for: "${query}"`);
  
  // Phân tích truy vấn và chuẩn hóa
  const normalizedQuery = normalizeText(query);
  
  // Trích xuất từ khóa từ truy vấn
  const keywords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
  
  // Trích xuất tên thuốc (nếu có)
  const medicineNames = extractMedicineNames(query);
  
  console.log(`Keywords extracted: ${keywords.join(', ')}`);
  if (medicineNames.length > 0) {
    console.log(`Medicine names detected: ${medicineNames.join(', ')}`);
  }
  
  // Nếu không có từ khóa có nghĩa, trả về rỗng
  if (keywords.length === 0) {
    return [];
  }
  
  // Phát hiện danh mục của query
  const queryCategory = detectCategory(query);
  console.log(`Query category detected: ${queryCategory || 'none'}`);
  
  // Thử tìm kiếm theo truy vấn chính xác hoặc gần đúng
  const exactOrCloseMatches = await this.find({
    question: { $regex: new RegExp(keywords.map(escapeRegExp).join(".*"), "i") }
  }).limit(1) as SearchResult[];
  
  if (exactOrCloseMatches.length > 0) {
    console.log(`Found close match: "${exactOrCloseMatches[0].question}"`);
    exactOrCloseMatches[0].searchScore = 100; // Perfect match
    return exactOrCloseMatches;
  }
  
  // Ưu tiên tìm kiếm theo danh mục nếu phát hiện được
  if (queryCategory) {
    // Tìm kiếm các câu hỏi cùng danh mục và chứa các từ khóa hoặc tên thuốc
    const query: any = { category: queryCategory };
    
    // Thêm điều kiện tìm kiếm tên thuốc nếu có
    if (medicineNames.length > 0) {
      const medicineRegex = medicineNames.map(name => new RegExp(escapeRegExp(name), 'i'));
      query.$or = [
        { medicineTerms: { $in: medicineRegex } },
        { question: { $in: medicineRegex } }
      ];
    }
    
    // Tìm kiếm theo danh mục và tên thuốc/từ khóa
    const categoryResults = await this.find(query)
      .limit(limit) as SearchResult[];
    
    if (categoryResults.length > 0) {
      // Tính điểm tương đồng cho các kết quả theo danh mục
      categoryResults.forEach(result => {
        let score = 75; // Điểm cơ bản cho việc khớp danh mục
        
        // Thưởng điểm cho việc khớp tên thuốc
        if (medicineNames.length > 0 && result.medicineTerms) {
          for (const medicine of medicineNames) {
            if (result.medicineTerms.includes(medicine)) {
              score += 15; // Tối đa 15 điểm cho việc khớp tên thuốc
              break;
            }
          }
        }
        
        // Thưởng điểm cho việc khớp từ khóa trong câu hỏi
        for (const keyword of keywords) {
          if (result.question.toLowerCase().includes(keyword.toLowerCase())) {
            score += 5; // Thêm 5 điểm cho mỗi từ khóa khớp
          }
        }
        
        // Giới hạn điểm tối đa là 100
        result.searchScore = Math.min(score, 100);
      });
      
      // Sắp xếp và trả về kết quả
      return categoryResults
        .sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0))
        .slice(0, limit);
    }
  }
  
  try {
    // Dùng MongoDB text search với trọng số từ khóa
    let searchQuery = keywords.join(' ');
    
    // Ưu tiên tên thuốc trong truy vấn tìm kiếm nếu có
    if (medicineNames.length > 0) {
      // Đặt tên thuốc lên đầu truy vấn và thêm trọng số cao hơn
      searchQuery = medicineNames.join(' ') + ' ' + searchQuery;
    }
    
    // Nếu có chuyên mục, thêm vào truy vấn
    if (queryCategory) {
      searchQuery = queryCategory + ' ' + searchQuery;
    }
    
    console.log(`Using text search with: "${searchQuery}"`);
    
    // Thêm điều kiện tìm kiếm nếu có danh mục
    const searchCondition: any = { $text: { $search: searchQuery } };
    if (queryCategory) {
      searchCondition.category = queryCategory;
    }
    
    // Thực hiện tìm kiếm văn bản với truy vấn nâng cao
    const textSearchResults = await this.find(
      searchCondition,
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit) as SearchResult[];
    
    if (textSearchResults.length > 0) {
      // Chuyển đổi điểm tìm kiếm MongoDB thành phần trăm (0-100)
      textSearchResults.forEach((result: SearchResult) => {
        // MongoDB text score thường nằm trong khoảng 0-X.XX
        // Chuyển đổi thành thang điểm 0-100 để dễ hiểu hơn
        const rawScore = result._doc && result._doc.score ? result._doc.score : 0;
        result.searchScore = Math.min(Math.round(rawScore * 25), 100);
      });
      
      console.log(`Text search found ${textSearchResults.length} results. Top score: ${textSearchResults[0].searchScore}`);
      
      // Chỉ trả về các kết quả có điểm tìm kiếm cao hơn ngưỡng
      return textSearchResults.filter((result: SearchResult) => (result.searchScore || 0) > 30);
    }
  } catch (error: any) {
    console.log('Text search failed, falling back to regex search:', error.message);
  }
  
  // Fallback: tìm kiếm bằng regex với thuật toán cải tiến
  console.log('Using regex search as fallback');
  
  // Tạo các biểu thức chính quy cho từng từ khóa
  const regexPatterns = keywords.map(term => new RegExp('\\b' + escapeRegExp(term) + '\\b', 'i'));
  
  // Lấy tối đa 100 bản ghi để phân tích ngoại tuyến
  let queryCondition: any = {};
  if (queryCategory) {
    queryCondition.category = queryCategory;
  }
  
  const allResults = await this.find(queryCondition).limit(100) as SearchResult[];
  
  // Tính toán điểm tương đồng với thuật toán cải tiến
  const scoredResults = allResults.map((result: SearchResult) => {
    const doc = result.toObject();
    let score = 0;
    
    // Tính điểm cho câu hỏi
    const questionWords = normalizeText(doc.question).split(/\s+/);
    const answerWords = normalizeText(doc.answer).split(/\s+/);
    
    // Điểm cho việc tìm thấy từ khóa trong câu hỏi
    for (const pattern of regexPatterns) {
      // Trọng số cao hơn cho câu hỏi
      if (pattern.test(doc.question)) score += 5;
      // Trọng số cho các trường khác
      if (doc.keywords && pattern.test(doc.keywords)) score += 3;
      if (doc.medicineTerms && pattern.test(doc.medicineTerms)) score += 4;
      if (pattern.test(doc.answer)) score += 2;
    }
    
    // Thưởng điểm cho việc phát hiện tên thuốc
    if (medicineNames.length > 0 && doc.medicineTerms) {
      for (const medicine of medicineNames) {
        if (doc.medicineTerms.toLowerCase().includes(medicine.toLowerCase())) {
          score += 10; // Thưởng điểm cao cho việc tìm thấy đúng tên thuốc
        }
      }
    }
    
    // Thưởng điểm cho phù hợp danh mục (nếu có thể phát hiện)
    if (queryCategory && doc.category && queryCategory === doc.category) {
      score += 15; // Tăng điểm thưởng cho việc khớp danh mục
    }
    
    // Đánh giá sự trùng lặp về từ (Jaccard similarity)
    const querySet = new Set(keywords);
    const questionSet = new Set(questionWords);
    
    // Tính hệ số Jaccard
    const intersection = new Set([...querySet].filter(x => questionSet.has(x)));
    const jaccardSim = intersection.size / (querySet.size + questionSet.size - intersection.size);
    
    // Thêm điểm dựa trên độ tương đồng Jaccard
    score += Math.round(jaccardSim * 20);
    
    // Chuyển đổi thành thang điểm 0-100
    const normalizedScore = Math.min(Math.round((score / 35) * 100), 100);
    
    // Lưu điểm tìm kiếm
    result.searchScore = normalizedScore;
    return result;
  });
  
  // Sắp xếp và trả về kết quả
  const filteredResults = scoredResults
    .filter((item: SearchResult) => (item.searchScore || 0) > 30) // Lọc ra các kết quả có điểm trên ngưỡng
    .sort((a: SearchResult, b: SearchResult) => (b.searchScore || 0) - (a.searchScore || 0))
    .slice(0, limit);
    
  console.log(`Regex search found ${filteredResults.length} results${filteredResults.length > 0 ? ` with top score ${filteredResults[0].searchScore}` : ''}`);
  
  return filteredResults;
};

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
  }
  
  return null;
}

// Hàm trợ giúp chuẩn hóa văn bản
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  // Tìm các từ bắt đầu bằng chữ hoa theo sau có thể là số và đơn vị (mg, g)
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
  
  // Tìm kiểu "thuốc X" hoặc "thuốc Y"
  const vietnameseMedicineRegex = /thuốc\s+([a-zA-Z0-9]+)/gi;
  let match;
  while ((match = vietnameseMedicineRegex.exec(text)) !== null) {
    if (match[1] && match[1].length > 1) { // Chỉ lấy nếu tên thuốc dài hơn 1 ký tự
      medicineMatches.push(match[1].toLowerCase());
    }
  }
  
  // Lọc ra các tên thuốc duy nhất
  return [...new Set(medicineMatches)];
}

// Create and export the model
export default mongoose.models.ChatbotQA ||
  mongoose.model<IChatbotQA>("ChatbotQA", ChatbotQASchema); 