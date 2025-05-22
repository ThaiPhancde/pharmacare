import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    // Lấy danh sách câu hỏi và câu trả lời từ model ChatbotQA
    const qaItems = await ChatbotQA.find({}).sort({ updatedAt: -1 }).limit(100);
    
    return { 
      success: true, 
      data: qaItems 
    };
  } catch (error: any) {
    console.error('Error fetching QA data:', error);
    return { 
      success: false, 
      message: error.message || 'Error fetching QA data' 
    };
  }
}); 