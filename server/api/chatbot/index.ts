import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  // Get all QA pairs to display in admin panel
  if (event.node.req.method === 'GET') {
    try {
      const qaData = await ChatbotQA.find({}).sort({ createdAt: -1 });
      return { success: true, data: qaData };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Add new QA pair (for admin)
  if (event.node.req.method === 'POST') {
    try {
      const body = await readBody(event);
      const { question, answer, category } = body;
      
      if (!question || !answer) {
        return { success: false, message: 'Question and answer are required' };
      }
      
      const newQA = await ChatbotQA.create({
        question,
        answer,
        category: category || 'general'
      });
      
      return { success: true, data: newQA };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  return { success: false, message: 'Method not allowed' };
}); 