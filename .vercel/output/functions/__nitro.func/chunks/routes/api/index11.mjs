import { d as defineEventHandler, a as getQuery, e as SupplierModel, r as readBody } from '../../_/nitro.mjs';
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
  try {
    const query = getQuery(event);
    const limit = Number(query.limit || 10);
    const page = Number(query.page || 1);
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      SupplierModel.find().skip(skip).limit(limit),
      SupplierModel.countDocuments()
    ]);
    return {
      data,
      total,
      pagination: {
        page,
        limit,
        total
      }
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error"
    };
  }
});
const createSupplier = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const dataResponse = await SupplierModel.create(body);
    return {
      data: dataResponse
      // Sử dụng interface thay vì `Supplier`
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error"
    };
  }
});

export { createSupplier, index as default };
//# sourceMappingURL=index11.mjs.map
