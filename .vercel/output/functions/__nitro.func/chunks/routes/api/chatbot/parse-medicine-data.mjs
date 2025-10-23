import { d as defineEventHandler, b as ChatbotQA } from '../../../_/nitro.mjs';
import fs from 'fs';
import path from 'path';
import 'mongoose';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'zod';
import 'bcryptjs';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const parseMedicineData = defineEventHandler(async (event) => {
  try {
    if (event.node.req.method !== "POST") {
      return { success: false, message: "Method not allowed. Use POST instead." };
    }
    const filePath = path.resolve(process.cwd(), "Medicine.txt");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");
    const qaPairs = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.includes("?")) {
        const question = line;
        let answer = "";
        let j = i + 1;
        while (j < lines.length) {
          const answerLine = lines[j].trim();
          if (answerLine.includes("?") && answer || !answerLine) {
            break;
          }
          if (answer && answerLine) answer += " ";
          if (answerLine) answer += answerLine;
          j++;
        }
        if (question && answer) {
          const medicineTerms = extractMedicineTerms(question);
          const keywords = extractKeywords(question + " " + answer);
          const category = detectCategory(question);
          qaPairs.push({
            question,
            answer,
            category,
            keywords: keywords.join(" "),
            medicineTerms: medicineTerms.join(" ")
          });
          i = j - 1;
        }
      }
    }
    const shouldReplace = true;
    if (shouldReplace) {
      await ChatbotQA.deleteMany({});
      console.log("Deleted existing QA data");
    }
    if (qaPairs.length > 0) {
      await ChatbotQA.insertMany(qaPairs);
      try {
        const db = ChatbotQA.db;
        const collection = db.collection("chatbotqas");
        await collection.dropIndexes();
        await collection.createIndex({
          question: "text",
          answer: "text",
          keywords: "text",
          medicineTerms: "text"
        }, {
          weights: {
            question: 10,
            medicineTerms: 5,
            keywords: 3,
            answer: 1
          },
          name: "chatbot_search_index"
        });
        console.log("Rebuilt MongoDB text index");
      } catch (indexError) {
        console.warn("Warning: Failed to rebuild text index -", indexError.message);
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
  } catch (error) {
    console.error("Error parsing Medicine.txt:", error);
    return {
      success: false,
      message: error.message || "Error parsing Medicine.txt"
    };
  }
});
function countByCategory(qaPairs) {
  return qaPairs.reduce((counts, qa) => {
    const category = qa.category || "uncategorized";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
}
function detectCategory(question) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("li\u1EC1u") || lowerQuestion.includes("l\u01B0\u1EE3ng") || lowerQuestion.includes("u\u1ED1ng")) {
    return "dosage";
  } else if (lowerQuestion.includes("t\xE1c d\u1EE5ng ph\u1EE5") || lowerQuestion.includes("ph\u1EA3n \u1EE9ng")) {
    return "side-effects";
  } else if (lowerQuestion.includes("ch\u1ED1ng ch\u1EC9 \u0111\u1ECBnh") || lowerQuestion.includes("b\u1EC7nh n\u1EC1n")) {
    return "contraindications";
  } else if (lowerQuestion.includes("t\u01B0\u01A1ng t\xE1c")) {
    return "interactions";
  } else if (lowerQuestion.includes("gi\xE1")) {
    return "price";
  } else if (lowerQuestion.includes("l\xE0 thu\u1ED1c") || lowerQuestion.includes("l\xE0m g\xEC") || lowerQuestion.includes("t\xE1c d\u1EE5ng")) {
    return "description";
  } else if (lowerQuestion.includes("ho\u1EA1t ch\u1EA5t") || lowerQuestion.includes("th\xE0nh ph\u1EA7n")) {
    return "composition";
  } else {
    return "general";
  }
}
function extractMedicineTerms(text) {
  const medicineRegex = /([A-Z][a-zÀ-ỹ]+(?:\s+[A-Z][a-zÀ-ỹ]+)*(?:\s+\d+(?:mg|g))?)/g;
  const matches = text.match(medicineRegex) || [];
  return [...new Set(matches)];
}
function extractKeywords(text) {
  const stopwords = [
    "v\xE0",
    "ho\u1EB7c",
    "l\xE0",
    "c\xF3",
    "nh\u1EEFng",
    "c\xE1c",
    "c\u1EE7a",
    "cho",
    "trong",
    "v\u1EDBi",
    "kh\xF4ng",
    "\u0111\u01B0\u1EE3c",
    "c\u1EA7n",
    "ph\u1EA3i",
    "n\xE0y",
    "n\xE0o",
    "m\u1ED9t",
    "c\xF2n",
    "th\xEC",
    "khi",
    "n\u1EBFu",
    "m\xE0",
    "\u0111\u1EC3",
    "t\u1EEB",
    "theo",
    "\u0111\u1EBFn",
    "qua",
    "g\xEC"
  ];
  const words = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
  return [...new Set(words)].filter((word) => word.length > 2 && !stopwords.includes(word));
}

export { parseMedicineData as default };
//# sourceMappingURL=parse-medicine-data.mjs.map
