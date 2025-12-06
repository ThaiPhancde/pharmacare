import { d as defineEventHandler, r as readBody, S as Stock, I as Invoice } from '../../../_/nitro.mjs';
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

const pos = defineEventHandler(async (event) => {
  const method = event.method;
  if (method === "POST") {
    const body = await readBody(event);
    body.is_pos = true;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      console.log("Creating POS invoice with payment method:", body.payment_method);
      const stockItems = [];
      for (const item of body.items) {
        let stock;
        if (item.stock_id) {
          stock = await Stock.findById(item.stock_id).session(session);
        } else {
          stock = await Stock.findOne({
            medicine: item.medicine,
            batch_id: item.batch_id
          }).session(session);
        }
        if (!stock) {
          throw new Error(`Stock not found for medicine: ${item.medicine} with batch: ${item.batch_id}`);
        }
        if (stock.unit_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine: ${item.medicine}. Available: ${stock.unit_quantity}, Requested: ${item.quantity}`);
        }
        stockItems.push({ stock, quantity: item.quantity });
      }
      body.items.forEach((item) => {
        delete item.stock_id;
        delete item.days_left;
        delete item.original_price;
        delete item.discount_percentage;
        delete item.discount_reason;
        delete item.purchase;
      });
      if (!body._id) {
        body._id = `INV-CUS-${Date.now()}`;
        console.log("Generated invoice ID:", body._id);
      }
      if (!body.payment_status) {
        body.payment_status = "paid";
      }
      if (body.payment_method === "cash") {
        const amountPaid = Number(body.paid);
        const grandTotal = Number(body.grand_total);
        if (amountPaid > grandTotal) {
          const change = amountPaid - grandTotal;
          if (!body.payment_details) {
            body.payment_details = {};
          }
          body.payment_details.change = change;
          body.due = 0;
          console.log(`Cash payment with change: Paid ${amountPaid}, Total ${grandTotal}, Change ${change}`);
        } else if (amountPaid < grandTotal) {
          body.due = grandTotal - amountPaid;
          body.payment_status = "partial";
          console.log(`Partial payment: Paid ${amountPaid}, Total ${grandTotal}, Due ${body.due}`);
        } else {
          body.due = 0;
          console.log(`Exact payment: Paid ${amountPaid}, Total ${grandTotal}`);
        }
      }
      console.log("Creating invoice with data:", JSON.stringify(body, null, 2));
      const created = await Invoice.create([body], { session });
      console.log("Invoice created with ID:", created[0]._id);
      for (const stockItem of stockItems) {
        const stock = stockItem.stock;
        const quantity = stockItem.quantity;
        stock.unit_quantity -= quantity;
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
        console.log(`Stock updated: Medicine ID ${stock.medicine}, New quantity: ${stock.unit_quantity}`);
      }
      await session.commitTransaction();
      session.endSession();
      return {
        status: true,
        data: created[0],
        message: "POS Invoice created successfully"
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("POS Invoice creation failed:", err);
      return {
        status: false,
        error: err.message || "Transaction failed",
        message: "Failed to create POS Invoice"
      };
    }
  } else {
    return {
      status: false,
      message: "Method not allowed. Only POST is supported for POS Invoice."
    };
  }
});

export { pos as default };
//# sourceMappingURL=pos.mjs.map
