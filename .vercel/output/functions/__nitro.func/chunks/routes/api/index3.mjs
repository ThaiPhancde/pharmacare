import { d as defineEventHandler, b as ChatbotQA, r as readBody } from '../../_/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  if (event.node.req.method === "GET") {
    try {
      const qaData = await ChatbotQA.find({}).sort({ createdAt: -1 });
      return { success: true, data: qaData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  if (event.node.req.method === "POST") {
    try {
      const body = await readBody(event);
      const { question, answer, category } = body;
      if (!question || !answer) {
        return { success: false, message: "Question and answer are required" };
      }
      const newQA = await ChatbotQA.create({
        question,
        answer,
        category: category || "general"
      });
      return { success: true, data: newQA };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  return { success: false, message: "Method not allowed" };
});

export { index as default };
//# sourceMappingURL=index3.mjs.map
