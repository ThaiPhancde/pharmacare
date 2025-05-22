import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    // Lấy tham số tìm kiếm từ query string
    const query = getQuery(event);
    const searchTerm = query.q as string;

    if (!searchTerm) {
      return { 
        success: false, 
        message: 'Search term is required' 
      };
    }

    console.log(`Searching for: "${searchTerm}"`);
    
    // Tìm kiếm câu hỏi và câu trả lời phù hợp
    // Sử dụng text search của MongoDB thay vì phương thức custom findSimilar
    let qaItems = [];
    
    try {
      // Thử tìm kiếm chính xác trước (với văn bản chứa từ khóa tìm kiếm)
      qaItems = await ChatbotQA.find({
        $or: [
          { question: { $regex: searchTerm, $options: 'i' } },
          { answer: { $regex: searchTerm, $options: 'i' } },
          { medicineTerms: { $regex: searchTerm, $options: 'i' } },
          { keywords: { $regex: searchTerm, $options: 'i' } }
        ]
      }).limit(30);
      
      // Nếu không có kết quả, thử text search
      if (qaItems.length === 0) {
        qaItems = await ChatbotQA.find(
          { $text: { $search: searchTerm } },
          { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(30);
      }
      
      console.log(`Found ${qaItems.length} results for "${searchTerm}"`);
    } catch (searchError) {
      console.error('Search error:', searchError);
      // Fallback: tìm với regex đơn giản
      qaItems = await ChatbotQA.find({
        question: { $regex: new RegExp(searchTerm, 'i') }
      }).limit(30);
      console.log(`Fallback search found ${qaItems.length} results`);
    }
    
    return { 
      success: true, 
      data: qaItems 
    };
  } catch (error: any) {
    console.error('Error searching QA data:', error);
    return { 
      success: false, 
      message: error.message || 'Error searching QA data' 
    };
  }
}); 