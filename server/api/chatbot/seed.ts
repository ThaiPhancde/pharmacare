import fs from 'fs';
import path from 'path';
import { ChatbotQA } from '~/server/models';

export default defineEventHandler(async (event) => {
  try {
    // Check if this is a POST request to ensure it's only triggered intentionally
    if (event.node.req.method !== 'POST') {
      return { success: false, message: 'This endpoint requires a POST request' };
    }

    // Read Medicine.txt
    const filePath = path.resolve(process.cwd(), 'Medicine.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Split content into lines
    const lines = fileContent.split('\n');
    
    const qaData = [];
    let currentQuestion = null;
    let currentAnswer = null;
    
    // Parse the file content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // If line ends with question mark, it's likely a question
      if (line.endsWith('?') && !currentQuestion) {
        currentQuestion = line;
        continue;
      }
      
      // If we have a question but no answer yet, this is the answer
      if (currentQuestion && !currentAnswer) {
        currentAnswer = line;
        
        // Add QA pair to array
        if (currentQuestion && currentAnswer) {
          qaData.push({
            question: currentQuestion,
            answer: currentAnswer,
            category: 'medicine'
          });
          
          // Reset for next QA pair
          currentQuestion = null;
          currentAnswer = null;
        }
        continue;
      }
    }
    
    // Clear existing data (optional, can be commented out to preserve existing data)
    await ChatbotQA.deleteMany({});
    
    // Insert all QA pairs into MongoDB
    if (qaData.length > 0) {
      await ChatbotQA.insertMany(qaData);
      return { 
        success: true, 
        message: `Successfully seeded ${qaData.length} QA pairs into database`,
        data: qaData
      };
    } else {
      return { success: false, message: 'No QA pairs were found in the file' };
    }
    
  } catch (error: any) {
    console.error('Error seeding chatbot data:', error);
    return { success: false, message: error.message };
  }
}); 