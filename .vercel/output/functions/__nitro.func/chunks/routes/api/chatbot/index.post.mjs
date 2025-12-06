import { d as defineEventHandler, r as readBody, b as ChatbotQA } from '../../../_/nitro.mjs';
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

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.question || !body.answer) {
      return {
        success: false,
        message: "Question and answer are required"
      };
    }
    const newItem = new ChatbotQA({
      question: body.question,
      answer: body.answer,
      category: body.category || "general",
      keywords: body.keywords,
      medicineTerms: body.medicineTerms
    });
    await newItem.save();
    return {
      success: true,
      data: newItem,
      message: "QA item created successfully"
    };
  } catch (error) {
    console.error("Error creating QA item:", error);
    return {
      success: false,
      message: error.message || "Error creating QA item"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
