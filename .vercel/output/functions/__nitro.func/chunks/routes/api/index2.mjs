import { d as defineEventHandler, a as getQuery, C as Category, r as readBody } from '../../_/nitro.mjs';
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
      Category.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Category.countDocuments()
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
    const created = await Category.create(body);
    return { status: true, data: created };
  }
});

export { index as default };
//# sourceMappingURL=index2.mjs.map
