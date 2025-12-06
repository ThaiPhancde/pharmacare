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
  try {
    const query = getQuery(event);
    const days = parseInt(query.days) || 30;
    const limit = parseInt(query.limit) || 5;
    const today = /* @__PURE__ */ new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + days);
    const expiringMedicines = await Stock.find({
      expiry_date: { $gte: today, $lte: expiryDate },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    }).populate("medicine").sort({ expiry_date: 1 }).limit(limit);
    const enhancedData = expiringMedicines.map((item) => {
      var _a;
      const expiryTime = new Date(item.expiry_date).getTime();
      const todayTime = today.getTime();
      const diffTime = expiryTime - todayTime;
      const daysLeft = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
      return {
        _id: item._id,
        daysLeft,
        medicineName: ((_a = item.medicine) == null ? void 0 : _a.name) || "Unknown",
        batchId: item.batch_id,
        expiryDate: item.expiry_date
      };
    });
    return {
      status: true,
      data: enhancedData,
      message: "L\u1EA5y d\u1EEF li\u1EC7u thu\u1ED1c s\u1EAFp h\u1EBFt h\u1EA1n th\xE0nh c\xF4ng"
    };
  } catch (error) {
    console.error("Error fetching expiring medicines:", error);
    return {
      status: false,
      error: "Kh\xF4ng th\u1EC3 l\u1EA5y d\u1EEF li\u1EC7u thu\u1ED1c s\u1EAFp h\u1EBFt h\u1EA1n"
    };
  }
});

export { expiring as default };
//# sourceMappingURL=expiring.mjs.map
