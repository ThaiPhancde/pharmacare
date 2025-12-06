import { d as defineEventHandler, a as getQuery, b as ChatbotQA } from '../../../_/nitro.mjs';
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
  try {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const [qaItems, total] = await Promise.all([
      ChatbotQA.find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      ChatbotQA.countDocuments({})
    ]);
    return {
      success: true,
      data: qaItems,
      total,
      page,
      limit
    };
  } catch (error) {
    console.error("Error fetching QA data:", error);
    return {
      success: false,
      message: error.message || "Error fetching QA data"
    };
  }
});

export { index as default };
//# sourceMappingURL=index.mjs.map
