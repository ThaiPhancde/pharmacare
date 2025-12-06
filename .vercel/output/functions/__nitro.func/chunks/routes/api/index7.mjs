import { d as defineEventHandler, a as getQuery, M as Medicine, r as readBody, S as Stock } from '../../_/nitro.mjs';
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
    const populate = query.populate || "";
    const search = query.search || "";
    const barcode = query.bar_code || "";
    const condition = {};
    if (barcode) {
      condition.bar_code = barcode;
      console.log(`Searching for medicine with barcode: ${barcode}`);
    } else if (search) {
      condition.$or = [
        { name: { $regex: search, $options: "i" } },
        { bar_code: { $regex: search, $options: "i" } },
        { generic: { $regex: search, $options: "i" } }
      ];
    }
    let medicineQuery = Medicine.find(condition).skip(skip).limit(limit).select("name bar_code image price generic description unit_id category_id type_id").sort({ createdAt: -1 }).lean();
    medicineQuery = medicineQuery.populate([
      {
        path: "unit_id",
        select: "name -_id"
      },
      {
        path: "category_id",
        select: "name -_id"
      },
      {
        path: "type_id",
        select: "name -_id"
      }
    ]);
    if (populate.includes("stocks")) {
      medicineQuery = medicineQuery.populate({
        path: "stocks",
        select: "_id unit_quantity batch_id expiry_date purchase_price mrp vat",
        options: { lean: true }
      });
    }
    const [data, total] = await Promise.all([
      medicineQuery,
      Medicine.countDocuments(condition)
    ]);
    const transformedData = data.map((item) => {
      const transformed = { ...item };
      if (item.category_id) {
        transformed.category = item.category_id;
        delete transformed.category_id;
      }
      if (item.unit_id) {
        transformed.unit = item.unit_id;
        delete transformed.unit_id;
      }
      if (item.type_id) {
        transformed.type = item.type_id;
        delete transformed.type_id;
      }
      transformed._id = item._id;
      transformed.barcode = item.bar_code || "";
      transformed.bar_code = item.bar_code || "";
      transformed.generic = item.generic || "";
      transformed.description = item.description || "";
      return transformed;
    });
    console.log(`Found ${data.length} medicine items with the condition:`, condition);
    if (data.length > 0) {
      console.log("First item barcode:", data[0].bar_code);
    }
    return {
      data: transformedData,
      total,
      status: true,
      message: "Get data successfully"
    };
  }
  if (method === "POST") {
    const body = await readBody(event);
    const session = await Medicine.startSession();
    session.startTransaction();
    try {
      const createdMedicine = await Medicine.create([body], { session });
      await Stock.create(
        [
          {
            medicine: createdMedicine[0]._id,
            batch_id: createdMedicine[0].bar_code || `BATCH-${Date.now()}`,
            expiry_date: new Date((/* @__PURE__ */ new Date()).setFullYear((/* @__PURE__ */ new Date()).getFullYear() + 2)),
            // Mặc định 2 năm hạn sử dụng
            box_pattern: "",
            box_quantity: 0,
            unit_quantity: 0,
            purchase_price: createdMedicine[0].supplierPrice || 0,
            mrp: createdMedicine[0].price || 0,
            vat: 0
            // Mặc định VAT là 0
          }
        ],
        { session }
      );
      await session.commitTransaction();
      session.endSession();
      return { status: true, data: createdMedicine[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction failed:", err);
      return { status: false, error: err.message || "Transaction failed" };
    }
  }
});

export { index as default };
//# sourceMappingURL=index7.mjs.map
