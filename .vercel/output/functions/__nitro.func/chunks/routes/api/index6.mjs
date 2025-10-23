import { d as defineEventHandler, a as getQuery, I as Invoice, r as readBody, S as Stock } from '../../_/nitro.mjs';
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
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortOptions = { updatedAt: -1 };
    const [data, total] = await Promise.all([
      Invoice.find().populate("items.medicine").populate("customer").sort(sortOptions).skip(skip).limit(limit),
      Invoice.countDocuments()
    ]);
    return {
      data,
      total,
      status: true,
      message: "Get data successfully"
    };
  }
  if (method === "POST") {
    const body = await readBody(event);
    const session = await Invoice.startSession();
    session.startTransaction();
    try {
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id
        }).session(session);
        if (!stock) {
          throw new Error(`Stock not found for medicine: ${item.medicine} with batch: ${item.batch_id}`);
        }
        if (stock.unit_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine: ${item.medicine}. Available: ${stock.unit_quantity}, Requested: ${item.quantity}`);
        }
      }
      if (body.payment_method === "cash" && body.paid > body.grand_total) {
        const change = body.paid - body.grand_total;
        if (!body.payment_details) {
          body.payment_details = {};
        }
        body.payment_details.change = change;
        body.due = 0;
      } else if (body.payment_method === "cash" && body.paid < body.grand_total) {
        body.due = body.grand_total - body.paid;
        body.payment_status = body.due > 0 ? "partial" : "paid";
      }
      const created = await Invoice.create([body], { session });
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id
        }).session(session);
        stock.unit_quantity -= item.quantity;
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
      await session.commitTransaction();
      session.endSession();
      return { status: true, data: created[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Invoice creation failed:", err);
      return { status: false, error: err.message || "Transaction failed" };
    }
  }
});

export { index as default };
//# sourceMappingURL=index6.mjs.map
