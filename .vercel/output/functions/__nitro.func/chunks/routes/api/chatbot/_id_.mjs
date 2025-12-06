import { d as defineEventHandler, b as ChatbotQA, r as readBody } from '../../../_/nitro.mjs';
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
  if (!id) {
    return { success: false, message: "Missing QA ID parameter" };
  }
  if (event.node.req.method === "GET") {
    try {
      const qa = await ChatbotQA.findById(id);
      if (!qa) {
        return { success: false, message: "QA pair not found" };
      }
      return { success: true, data: qa };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  if (event.node.req.method === "PUT") {
    try {
      const body = await readBody(event);
      const { question, answer, category } = body;
      if (!question || !answer) {
        return { success: false, message: "Question and answer are required" };
      }
      const updatedQA = await ChatbotQA.findByIdAndUpdate(
        id,
        { question, answer, category },
        { new: true }
      );
      if (!updatedQA) {
        return { success: false, message: "QA pair not found" };
      }
      return { success: true, data: updatedQA };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  if (event.node.req.method === "DELETE") {
    try {
      const deleteResult = await ChatbotQA.findByIdAndDelete(id);
      if (!deleteResult) {
        return { success: false, message: "QA pair not found" };
      }
      return { success: true, message: "QA pair deleted successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  return { success: false, message: "Method not allowed" };
});

export { _id_ as default };
//# sourceMappingURL=_id_.mjs.map
