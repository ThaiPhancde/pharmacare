import { d as defineEventHandler, g as getRouterParam, r as readBody, T as TypeMedicine } from '../../../_/nitro.mjs';
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

const _id_ = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;
  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await TypeMedicine.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }
  if (method === "DELETE") {
    await TypeMedicine.findByIdAndDelete(id);
    return { status: true, message: "Deleted" };
  }
});

export { _id_ as default };
//# sourceMappingURL=_id_.mjs.map
