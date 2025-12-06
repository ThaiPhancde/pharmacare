import { d as defineEventHandler, g as getRouterParam, B as Bank, r as readBody } from '../../../_/nitro.mjs';
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
  const id = getRouterParam(event, "id");
  const method = event.method;
  if (method === "GET") {
    try {
      const bank = await Bank.findById(id);
      if (!bank) {
        return {
          status: false,
          message: "Bank account not found"
        };
      }
      return {
        data: bank,
        status: true,
        message: "Get bank account successfully"
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Error getting bank account"
      };
    }
  }
  if (method === "PUT") {
    try {
      const body = await readBody(event);
      if (!body.bank_name || !body.account_name || !body.account_number) {
        return {
          status: false,
          message: "Bank name, account name and account number are required"
        };
      }
      body.updated_at = /* @__PURE__ */ new Date();
      const updatedBank = await Bank.findByIdAndUpdate(id, body, { new: true });
      if (!updatedBank) {
        return {
          status: false,
          message: "Bank account not found"
        };
      }
      return {
        data: updatedBank,
        status: true,
        message: "Bank account updated successfully"
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Error updating bank account"
      };
    }
  }
  if (method === "DELETE") {
    try {
      const deletedBank = await Bank.findByIdAndDelete(id);
      if (!deletedBank) {
        return {
          status: false,
          message: "Bank account not found"
        };
      }
      return {
        data: deletedBank,
        status: true,
        message: "Bank account deleted successfully"
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Error deleting bank account"
      };
    }
  }
  return {
    status: false,
    message: "Method not allowed"
  };
});

export { _id_ as default };
//# sourceMappingURL=_id_.mjs.map
