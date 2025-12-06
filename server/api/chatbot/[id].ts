import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    return { success: false, message: 'Missing QA ID parameter' };
  }

  // Handle GET request - get a specific QA pair
  if (event.node.req.method === 'GET') {
    try {
      const qa = await ChatbotQA.findById(id);
      if (!qa) {
        return { success: false, message: 'QA pair not found' };
      }
      return { success: true, data: qa };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Handle PUT request - update a QA pair
  if (event.node.req.method === 'PUT') {
    try {
      const body = await readBody(event);
      const { question, answer, category } = body;
      
      if (!question || !answer) {
        return { success: false, message: 'Question and answer are required' };
      }
      
      const updatedQA = await ChatbotQA.findByIdAndUpdate(
        id,
        { question, answer, category },
        { new: true }
      );
      
      if (!updatedQA) {
        return { success: false, message: 'QA pair not found' };
      }
      
      return { success: true, data: updatedQA };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  // Handle DELETE request - delete a QA pair
  if (event.node.req.method === 'DELETE') {
    try {
      const deleteResult = await ChatbotQA.findByIdAndDelete(id);
      
      if (!deleteResult) {
        return { success: false, message: 'QA pair not found' };
      }
      
      return { success: true, message: 'QA pair deleted successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
  
  return { success: false, message: 'Method not allowed' };
}); 