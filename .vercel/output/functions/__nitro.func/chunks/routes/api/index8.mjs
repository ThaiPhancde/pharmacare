import { d as defineEventHandler, a as getQuery, P as Purchase, r as readBody, e as SupplierModel, S as Stock } from '../../_/nitro.mjs';
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
    const [data, total] = await Promise.all([
      Purchase.find().populate("items.medicine").populate("supplier").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Purchase.countDocuments()
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
    const session = await Purchase.startSession();
    session.startTransaction();
    try {
      const created = await Purchase.create([body], { session });
      const purchaseId = created[0]._id;
      if (created[0].supplier) {
        await SupplierModel.updateOne(
          { _id: created[0].supplier },
          { $inc: { balance: -body.total } },
          { session }
        );
      }
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
          expiry_date: item.expiry_date
          // Thêm điều kiện tìm theo ngày hết hạn
        }).session(session);
        if (stock) {
          stock.box_pattern = item.box_pattern;
          stock.box_quantity += item.box_quantity;
          stock.unit_quantity += item.unit_quantity;
          stock.purchase_price = item.supplier_price;
          stock.mrp = item.mrp;
          stock.vat = item.vat;
          await stock.save({ session });
        } else {
          await Stock.create(
            [
              {
                medicine: item.medicine,
                purchase: purchaseId,
                // Lưu liên kết đến Purchase
                batch_id: item.batch_id,
                expiry_date: item.expiry_date,
                box_pattern: item.box_pattern,
                box_quantity: item.box_quantity,
                unit_quantity: item.unit_quantity,
                purchase_price: item.supplier_price,
                mrp: item.mrp,
                vat: item.vat
              }
            ],
            { session }
          );
        }
      }
      await session.commitTransaction();
      session.endSession();
      return { status: true, data: created[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Purchase creation failed:", err);
      return { status: false, error: "Transaction failed" };
    }
  }
});

export { index as default };
//# sourceMappingURL=index8.mjs.map
