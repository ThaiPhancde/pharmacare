import fs from 'fs';
import path from 'path';
import { ChatbotQA } from '~/server/models';

// Định nghĩa kiểu dữ liệu để thêm properties mới
interface QAPair {
  question: string;
  answer: string;
  category?: string;
  keywords?: string;
  medicineTerms?: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Ensure this is a POST request
    if (event.node.req.method !== 'POST') {
      return { success: false, message: 'Method not allowed. Use POST instead.' };
    }

    // Read the Medicine.txt file
    const filePath = path.resolve(process.cwd(), 'Medicine.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const qaPairs: QAPair[] = [];
    
    // Parse the file content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check if this is a question line (ends with ?)
      if (line.includes('?')) {
        const question = line;
        let answer = '';
        
        // Collect the answer from subsequent lines until we hit an empty line or another question
        let j = i + 1;
        while (j < lines.length) {
          const answerLine = lines[j].trim();
          
          // If we encounter another question or an empty line after getting some answer, stop
          if ((answerLine.includes('?') && answer) || !answerLine) {
            break;
          }
          
          // Add to answer with space in between lines
          if (answer && answerLine) answer += ' ';
          if (answerLine) answer += answerLine;
          
          j++;
        }
        
        // Only add if we have both question and answer
        if (question && answer) {
          // Extract medicine terms from question (capitalized words that might be medicine names)
          const medicineTerms = extractMedicineTerms(question);
          
          // Extract keywords
          const keywords = extractKeywords(question + " " + answer);
          
          // Detect category based on content
          const category = detectCategory(question);
          
          qaPairs.push({
            question,
            answer,
            category,
            keywords: keywords.join(' '),
            medicineTerms: medicineTerms.join(' ')
          });
          
          // Skip the processed lines
          i = j - 1;
        }
      }
    }

    // Delete existing data if directed
    const shouldReplace = true; // You can make this configurable
    if (shouldReplace) {
      await ChatbotQA.deleteMany({});
      console.log('Deleted existing QA data');
    }

    // Insert the new data
    if (qaPairs.length > 0) {
      await ChatbotQA.insertMany(qaPairs);
      
      // Rebuild text index
      try {
        const db = ChatbotQA.db;
        const collection = db.collection('chatbotqas');
        await collection.dropIndexes();
        await collection.createIndex({ 
          question: 'text', 
          answer: 'text',
          keywords: 'text',
          medicineTerms: 'text'
        }, {
          weights: {
            question: 10,
            medicineTerms: 5,
            keywords: 3,
            answer: 1
          },
          name: "chatbot_search_index"
        });
        console.log('Rebuilt MongoDB text index');
      } catch (indexError: any) {
        console.warn('Warning: Failed to rebuild text index -', indexError.message);
      }
    }

    return { 
      success: true, 
      message: `Successfully parsed ${qaPairs.length} QA pairs from Medicine.txt`,
      count: qaPairs.length,
      data: {
        totalExtracted: qaPairs.length,
        byCategoryCount: countByCategory(qaPairs)
      }
    };
  } catch (error: any) {
    console.error('Error parsing Medicine.txt:', error);
    return { 
      success: false, 
      message: error.message || 'Error parsing Medicine.txt'
    };
  }
});

// Count QA pairs by category
function countByCategory(qaPairs: QAPair[]): Record<string, number> {
  return qaPairs.reduce((counts: Record<string, number>, qa) => {
    const category = qa.category || 'uncategorized';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
}

// Helper function to detect category based on question content
function detectCategory(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('liều') || lowerQuestion.includes('lượng') || lowerQuestion.includes('uống')) {
    return 'dosage';
  } else if (lowerQuestion.includes('tác dụng phụ') || lowerQuestion.includes('phản ứng')) {
    return 'side-effects';
  } else if (lowerQuestion.includes('chống chỉ định') || lowerQuestion.includes('bệnh nền')) {
    return 'contraindications';
  } else if (lowerQuestion.includes('tương tác')) {
    return 'interactions';
  } else if (lowerQuestion.includes('giá')) {
    return 'price';
  } else if (lowerQuestion.includes('là thuốc') || lowerQuestion.includes('làm gì') || lowerQuestion.includes('tác dụng')) {
    return 'description';
  } else if (lowerQuestion.includes('hoạt chất') || lowerQuestion.includes('thành phần')) {
    return 'composition';
  } else {
    return 'general';
  }
}

// Extract medicine terms from the document
function extractMedicineTerms(text: string): string[] {
  // Biểu thức chính quy tìm tên thuốc - chú ý tìm cả từ có dấu tiếng Việt
  // Matches patterns like "Brufen 400mg", "Paracetamol", "Vitamin C", etc.
  const medicineRegex = /([A-Z][a-zÀ-ỹ]+(?:\s+[A-Z][a-zÀ-ỹ]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  
  // Filter to only unique terms
  return [...new Set(matches)];
}

// Extract keywords from a text
function extractKeywords(text: string): string[] {
  // Vietnamese stopwords list
  const stopwords = [
    'và', 'hoặc', 'là', 'có', 'những', 'các', 'của', 'cho', 'trong', 'với', 
    'không', 'được', 'cần', 'phải', 'này', 'nào', 'một', 'còn', 'thì',
    'khi', 'nếu', 'mà', 'để', 'từ', 'theo', 'đến', 'qua', 'gì'
  ];
  
  // Remove punctuation and split into words
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);
  
  // Filter out stopwords and words that are too short
  return [...new Set(words)]
    .filter(word => word.length > 2 && !stopwords.includes(word));
} 