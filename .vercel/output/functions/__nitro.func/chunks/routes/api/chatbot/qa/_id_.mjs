import { d as defineEventHandler, b as ChatbotQA, r as readBody } from '../../../../_/nitro.mjs';
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

const _id_ = defineEventHandler(async (event) => {
  var _a;
  const id = (_a = event.context.params) == null ? void 0 : _a.id;
  const method = event.node.req.method;
  if (!id) {
    return {
      success: false,
      message: "ID is required"
    };
  }
  try {
    if (method === "GET") {
      const qaItem = await ChatbotQA.findById(id);
      if (!qaItem) {
        return {
          success: false,
          message: "QA item not found"
        };
      }
      return {
        success: true,
        data: qaItem
      };
    } else if (method === "PUT") {
      const body = await readBody(event);
      if (!body.question || !body.answer) {
        return {
          success: false,
          message: "Question and answer are required"
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
          message: "QA item not found"
        };
      }
      return {
        success: true,
        data: updatedItem
      };
    } else if (method === "DELETE") {
      const deletedItem = await ChatbotQA.findByIdAndDelete(id);
      if (!deletedItem) {
        return {
          success: false,
          message: "QA item not found"
        };
      }
      return {
        success: true,
        message: "QA item deleted successfully"
      };
    }
    return {
      success: false,
      message: "Method not supported"
    };
  } catch (error) {
    console.error(`Error processing ${method} request:`, error);
    return {
      success: false,
      message: error.message || `Error processing ${method} request`
    };
  }
});

export { _id_ as default };
//# sourceMappingURL=_id_.mjs.map
