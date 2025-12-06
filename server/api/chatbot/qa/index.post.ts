import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.question || !body.answer) {
      return { 
        success: false, 
        message: 'Question and answer are required' 
      };
    }
    
    const newItem = new ChatbotQA({
      question: body.question,
      answer: body.answer,
      category: body.category || 'general',
      keywords: body.keywords,
      medicineTerms: body.medicineTerms
    });
    
    await newItem.save();
    
    return { 
      success: true, 
      data: newItem,
      message: 'QA item created successfully' 
    };
  } catch (error: any) {
    console.error('Error creating QA item:', error);
    return { 
      success: false, 
      message: error.message || 'Error creating QA item' 
    };
  }
}); 