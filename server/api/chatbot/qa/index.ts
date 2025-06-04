import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Lấy tổng số bản ghi và dữ liệu có phân trang
    const [qaItems, total] = await Promise.all([
      ChatbotQA.find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      ChatbotQA.countDocuments({})
    ]);
    
    return { 
      success: true, 
      data: qaItems,
      total,
      page,
      limit
    };
  } catch (error: any) {
    console.error('Error fetching QA data:', error);
    return { 
      success: false, 
      message: error.message || 'Error fetching QA data' 
    };
  }
}); 