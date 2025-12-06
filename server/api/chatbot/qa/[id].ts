import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  const method = event.node.req.method;

  if (!id) {
    return { 
      success: false, 
      message: 'ID is required' 
    };
  }

  try {
    // GET - Lấy chi tiết một cặp Q&A
    if (method === 'GET') {
      const qaItem = await ChatbotQA.findById(id);
      
      if (!qaItem) {
        return { 
          success: false, 
          message: 'QA item not found' 
        };
      }
      
      return { 
        success: true, 
        data: qaItem 
      };
    }
    
    // PUT - Cập nhật một cặp Q&A
    else if (method === 'PUT') {
      const body = await readBody(event);
      
      if (!body.question || !body.answer) {
        return { 
          success: false, 
          message: 'Question and answer are required' 
        };
      }
      
      const updatedItem = await ChatbotQA.findByIdAndUpdate(
        id, 
        {
          question: body.question,
          answer: body.answer,
          category: body.category,
          keywords: body.keywords,
          medicineTerms: body.medicineTerms
        },
        { new: true }
      );
      
      if (!updatedItem) {
        return { 
          success: false, 
          message: 'QA item not found' 
        };
      }
      
      return { 
        success: true, 
        data: updatedItem 
      };
    }
    
    // DELETE - Xóa một cặp Q&A
    else if (method === 'DELETE') {
      const deletedItem = await ChatbotQA.findByIdAndDelete(id);
      
      if (!deletedItem) {
        return { 
          success: false, 
          message: 'QA item not found' 
        };
      }
      
      return { 
        success: true, 
        message: 'QA item deleted successfully' 
      };
    }
    
    return { 
      success: false, 
      message: 'Method not supported' 
    };
  } catch (error: any) {
    console.error(`Error processing ${method} request:`, error);
    return { 
      success: false, 
      message: error.message || `Error processing ${method} request` 
    };
  }
}); 