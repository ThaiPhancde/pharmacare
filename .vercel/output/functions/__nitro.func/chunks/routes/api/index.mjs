import { d as defineEventHandler, a as getQuery, B as Bank, r as readBody } from '../../_/nitro.mjs';
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
  const method = event.method;
  if (method === "GET") {
    try {
      const query = getQuery(event);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;
      const active = query.active === "true" ? { status: true } : {};
      const [data, total] = await Promise.all([
        Bank.find(active).skip(skip).limit(limit).lean(),
        Bank.countDocuments(active)
      ]);
      return {
        data,
        total,
        status: true,
        message: "Get bank accounts successfully"
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        status: false,
        message: error.message || "Error getting bank accounts"
      };
    }
  }
  if (method === "POST") {
    try {
      const body = await readBody(event);
      if (!body.bank_name || !body.account_name || !body.account_number) {
        return {
          status: false,
          message: "Bank name, account name and account number are required"
        };
      }
      body.created_at = /* @__PURE__ */ new Date();
      const newBank = new Bank(body);
      await newBank.save();
      return {
        data: newBank,
        status: true,
        message: "Bank account created successfully"
      };
    } catch (error) {
      return {
        status: false,
        message: error.message || "Error creating bank account"
      };
    }
  }
  if (method === "PUT") {
    try {
      const body = await readBody(event);
      if (!body.id) {
        return {
          status: false,
          message: "Bank ID is required"
        };
      }
      const updatedBank = await Bank.findByIdAndUpdate(body.id, body, { new: true });
      if (!updatedBank) {
        return {
          status: false,
          message: "Bank account not found"
        };
      }
      return {
        status: true,
        message: "Bank account updated successfully",
        data: updatedBank
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
      const body = await readBody(event);
      if (!body.id) {
        return {
          status: false,
          message: "Bank ID is required"
        };
      }
      const deletedBank = await Bank.findByIdAndDelete(body.id);
      if (!deletedBank) {
        return {
          status: false,
          message: "Bank account not found"
        };
      }
      return {
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

export { index as default };
//# sourceMappingURL=index.mjs.map
