import { d as defineEventHandler, e as SupplierModel, r as readBody } from '../../../_/nitro.mjs';
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
  var _a;
  try {
    const id = (_a = event.context.params) == null ? void 0 : _a.id;
    const response = {
      data: await SupplierModel.findById(id) || null
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error"
    };
  }
});
const updateSupplier = defineEventHandler(async (event) => {
  var _a;
  try {
    const id = (_a = event.context.params) == null ? void 0 : _a.id;
    const body = await readBody(event);
    const response = {
      data: await SupplierModel.findByIdAndUpdate(id, body, { new: true }) || null
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error"
    };
  }
});
const deleteSupplier = defineEventHandler(async (event) => {
  var _a;
  try {
    const id = (_a = event.context.params) == null ? void 0 : _a.id;
    const response = {
      data: await SupplierModel.findByIdAndDelete(id) || null
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error"
    };
  }
});

export { _id_ as default, deleteSupplier, updateSupplier };
//# sourceMappingURL=_id_.mjs.map
