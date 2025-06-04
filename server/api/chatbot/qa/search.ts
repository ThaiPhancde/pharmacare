import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const q = query.q as string || '';
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return {
        success: false,
        message: 'Search query is required'
      };
    }

    // Tạo điều kiện tìm kiếm
    const searchCondition = {
      $or: [
        { question: { $regex: q, $options: 'i' } },
        { answer: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } },
        { medicineTerms: { $regex: q, $options: 'i' } }
      ]
    };

    // Lấy kết quả phân trang và tổng số
    const [results, total] = await Promise.all([
      ChatbotQA.find(searchCondition).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      ChatbotQA.countDocuments(searchCondition)
    ]);

    return {
      success: true,
      data: results,
      total,
      page,
      limit
    };
  } catch (error: any) {
    console.error('Search error:', error);
    return {
      success: false,
      message: error.message || 'Error searching QA data'
    };
  }
}); 