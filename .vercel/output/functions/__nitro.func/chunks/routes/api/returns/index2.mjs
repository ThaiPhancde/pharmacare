import { d as defineEventHandler, j as getMethod, c as createError, r as readBody, S as Stock } from '../../../_/nitro.mjs';
import mongoose, { Schema } from 'mongoose';
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

const SupplierReturnItemSchema = new Schema({
  medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
  medicineName: { type: String, required: true },
  batchId: { type: String, required: true },
  expiryDate: { type: Date },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true }
});
const SupplierReturnSchema = new Schema({
  returnNumber: { type: String, required: true, unique: true },
  purchase: { type: Schema.Types.ObjectId, ref: "Purchase", required: true },
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
  returnDate: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  items: [SupplierReturnItemSchema]
}, { timestamps: true });
const SupplierReturn = mongoose.models.SupplierReturn || mongoose.model("SupplierReturn", SupplierReturnSchema);

const index = defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === "GET") {
    try {
      const returns = await SupplierReturn.find().populate("items.medicine").populate("supplier").populate("purchase").sort({ createdAt: -1 });
      return {
        status: true,
        data: returns,
        message: "Supplier returns retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching supplier returns:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error fetching supplier returns: ${error.message}`
      });
    }
  }
  if (method === "POST") {
    try {
      const body = await readBody(event);
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const returnRecord = await SupplierReturn.create([{
          returnNumber: body.returnNumber,
          purchase: body.purchaseId,
          supplier: body.supplierId,
          returnDate: body.returnDate,
          totalAmount: body.totalAmount,
          reason: body.reason,
          status: body.status,
          items: body.items.map((item) => ({
            medicine: item.medicineId,
            medicineName: item.medicineName,
            batchId: item.batchId,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          }))
        }], { session });
        for (const item of body.items) {
          const stock = await Stock.findOne({
            medicine: item.medicineId,
            batch_id: item.batchId
          }).session(session);
          if (stock) {
            stock.unit_quantity = Math.max(0, stock.unit_quantity - item.quantity);
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
        await session.commitTransaction();
        session.endSession();
        return {
          status: true,
          data: returnRecord[0],
          message: "Supplier return created successfully"
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error("Error creating supplier return:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error creating supplier return: ${error.message}`
      });
    }
  }
  return {
    status: false,
    message: "Method not supported"
  };
});

export { index as default };
//# sourceMappingURL=index2.mjs.map
