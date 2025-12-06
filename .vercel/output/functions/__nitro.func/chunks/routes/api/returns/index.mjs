import { d as defineEventHandler, j as getMethod, h as CustomerReturn, c as createError, r as readBody, S as Stock } from '../../../_/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === "GET") {
    try {
      const returns = await CustomerReturn.find().populate("items.medicine").populate("customer").populate("invoice").sort({ createdAt: -1 });
      return {
        status: true,
        data: returns,
        message: "Customer returns retrieved successfully"
      };
    } catch (error) {
      console.error("Error fetching customer returns:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error fetching customer returns: ${error.message}`
      });
    }
  }
  if (method === "POST") {
    try {
      const body = await readBody(event);
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const returnRecord = await CustomerReturn.create([{
          returnNumber: body.returnNumber,
          invoice: body.invoiceId,
          customer: body.customerId,
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
        await session.commitTransaction();
        session.endSession();
        return {
          status: true,
          data: returnRecord[0],
          message: "Customer return created successfully"
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error) {
      console.error("Error creating customer return:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error creating customer return: ${error.message}`
      });
    }
  }
  return {
    status: false,
    message: "Method not supported"
  };
});

export { index as default };
//# sourceMappingURL=index.mjs.map
