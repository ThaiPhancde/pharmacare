import { d as defineEventHandler, a as getQuery, b as ChatbotQA } from '../../../../_/nitro.mjs';
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

const search = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const q = query.q || "";
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    if (!q) {
      return {
        success: false,
        message: "Search query is required"
      };
    }
    const searchCondition = {
      $or: [
        { question: { $regex: q, $options: "i" } },
        { answer: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { keywords: { $regex: q, $options: "i" } },
        { medicineTerms: { $regex: q, $options: "i" } }
      ]
    };
    const [results, total] = await Promise.all([
      ChatbotQA.find(searchCondition).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      ChatbotQA.countDocuments(searchCondition)
    ]);
    return {
      success: true,
      data: results,
      total,
      page,
      limit
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      message: error.message || "Error searching QA data"
    };
  }
});

export { search as default };
//# sourceMappingURL=search.mjs.map
