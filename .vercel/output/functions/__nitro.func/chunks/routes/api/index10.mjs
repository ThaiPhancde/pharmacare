import { d as defineEventHandler, a as getQuery, S as Stock, r as readBody } from '../../_/nitro.mjs';
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
  var _a, _b, _c;
  const method = event.method;
  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const stocks = await Stock.find().populate("medicine", "name bar_code").populate({
      path: "purchase",
      populate: {
        path: "supplier",
        select: "name"
      }
    }).sort({ createdAt: -1 });
    const groupedData = [];
    const groupedMap = /* @__PURE__ */ new Map();
    for (const stock of stocks) {
      if (!stock.medicine) continue;
      const key = `${stock.medicine._id}-${stock.batch_id}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          medicine: stock.medicine,
          batch_id: stock.batch_id,
          variants: [],
          total_unit_quantity: 0
        });
        groupedData.push(groupedMap.get(key));
      }
      const group = groupedMap.get(key);
      group.variants.push({
        _id: stock._id,
        expiry_date: stock.expiry_date,
        box_pattern: stock.box_pattern,
        box_quantity: stock.box_quantity,
        unit_quantity: stock.unit_quantity,
        purchase_price: stock.purchase_price,
        mrp: stock.mrp,
        vat: stock.vat,
        supplier: ((_b = (_a = stock.purchase) == null ? void 0 : _a.supplier) == null ? void 0 : _b.name) || "Unknown",
        purchase_id: (_c = stock.purchase) == null ? void 0 : _c._id,
        createdAt: stock.createdAt
      });
      group.total_unit_quantity += stock.unit_quantity || 0;
    }
    const totalGroups = groupedData.length;
    const paginatedData = groupedData.slice(skip, skip + limit);
    return {
      data: paginatedData,
      total: totalGroups,
      status: true,
      message: "Get data successfully"
    };
  }
  if (method === "POST") {
    const body = await readBody(event);
    const created = await Stock.create(body);
    return { status: true, data: created };
  }
});

export { index as default };
//# sourceMappingURL=index10.mjs.map
