import { d as defineEventHandler, a as getQuery, S as Stock } from '../../../_/nitro.mjs';
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

const expiring = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const days = parseInt(query.days) || 999999;
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const today = /* @__PURE__ */ new Date();
  try {
    let queryCondition;
    if (days >= 999999) {
      queryCondition = {
        $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
      };
    } else {
      const expiryDate = /* @__PURE__ */ new Date();
      expiryDate.setDate(today.getDate() + days);
      queryCondition = {
        expiry_date: { $gte: today, $lte: expiryDate },
        $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
      };
    }
    const [data, total] = await Promise.all([
      Stock.find(queryCondition).populate("medicine").populate({
        path: "purchase",
        select: "invoice_no date supplier",
        populate: {
          path: "supplier",
          select: "name phone"
        }
      }).skip(skip).limit(limit).sort({ expiry_date: 1 }),
      Stock.countDocuments(queryCondition)
    ]);
    const enhancedData = data.map((item) => {
      const expiryTime = new Date(item.expiry_date).getTime();
      const todayTime = today.getTime();
      const diffTime = expiryTime - todayTime;
      const daysLeft = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      return {
        ...item.toObject(),
        daysLeft
      };
    });
    return {
      status: true,
      data: enhancedData,
      total,
      message: "Data retrieved successfully"
    };
  } catch (error) {
    console.error("Error fetching expiring stocks:", error);
    return {
      status: false,
      error: "Unable to fetch expiring medicines data"
    };
  }
});

export { expiring as default };
//# sourceMappingURL=expiring.mjs.map
