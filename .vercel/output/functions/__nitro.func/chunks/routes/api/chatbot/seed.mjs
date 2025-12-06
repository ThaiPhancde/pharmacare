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

const seed = defineEventHandler(async (event) => {
  try {
    if (event.node.req.method !== "POST") {
      return { success: false, message: "This endpoint requires a POST request" };
    }
    const filePath = path.resolve(process.cwd(), "Medicine.txt");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");
    const qaData = [];
    let currentQuestion = null;
    let currentAnswer = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.endsWith("?") && !currentQuestion) {
        currentQuestion = line;
        continue;
      }
      if (currentQuestion && !currentAnswer) {
        currentAnswer = line;
        if (currentQuestion && currentAnswer) {
          qaData.push({
            question: currentQuestion,
            answer: currentAnswer,
            category: "medicine"
          });
          currentQuestion = null;
          currentAnswer = null;
        }
        continue;
      }
    }
    await ChatbotQA.deleteMany({});
    if (qaData.length > 0) {
      await ChatbotQA.insertMany(qaData);
      return {
        success: true,
        message: `Successfully seeded ${qaData.length} QA pairs into database`,
        data: qaData
      };
    } else {
      return { success: false, message: "No QA pairs were found in the file" };
    }
  } catch (error) {
    console.error("Error seeding chatbot data:", error);
    return { success: false, message: error.message };
  }
});

export { seed as default };
//# sourceMappingURL=seed.mjs.map
