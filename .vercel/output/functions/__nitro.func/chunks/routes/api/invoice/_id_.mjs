import { d as defineEventHandler, I as Invoice, S as Stock } from '../../../_/nitro.mjs';
import mongoose from 'mongoose';
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
  const method = event.method;
  const { id: rawId } = event.context.params || {};
  if (!rawId) {
    return {
      status: false,
      message: "Invoice ID is required"
    };
  }
  const id = decodeURIComponent(rawId).replace(/\s+/g, "-").toUpperCase();
  console.log(`Processing normalized invoice ID: ${id} (original: ${rawId})`);
  if (method === "GET") {
    try {
      const invoice = await Invoice.findOne({ _id: id }).populate("items.medicine").populate("customer");
      if (!invoice) {
        console.log(`Invoice not found with ID: ${id}`);
        return {
          status: false,
          message: "Invoice not found"
        };
      }
      return {
        status: true,
        data: invoice,
        message: "Invoice details retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return {
        status: false,
        message: "Failed to fetch invoice details"
      };
    }
  }
  if (method === "DELETE") {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const invoice = await Invoice.findOne({ _id: id }).session(session);
      if (!invoice) {
        await session.abortTransaction();
        session.endSession();
        return {
          status: false,
          message: "Invoice not found"
        };
      }
      for (const item of invoice.items) {
        let stock;
        if (item.stock_id) {
          stock = await Stock.findById(item.stock_id).session(session);
        } else {
          stock = await Stock.findOne({
            medicine: item.medicine,
            batch_id: item.batch_id
          }).session(session);
        }
        if (stock) {
          stock.unit_quantity += item.quantity;
          if (stock.box_pattern) {
            const boxMatch = stock.box_pattern.match(/(\d+)/);
            if (boxMatch) {
              const unitsPerBox = parseInt(boxMatch[0]);
              if (unitsPerBox > 0) {
                stock.box_quantity = Math.floor(stock.unit_quantity / unitsPerBox);
              }
            }
          }
          await stock.save({ session });
        }
      }
      await Invoice.deleteOne({ _id: id }).session(session);
      await session.commitTransaction();
      session.endSession();
      return {
        status: true,
        message: "Invoice deleted successfully"
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error deleting invoice:", error);
      return {
        status: false,
        message: "Failed to delete invoice"
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
