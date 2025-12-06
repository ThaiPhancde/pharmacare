import { d as defineEventHandler, g as getRouterParam, i as CustomerModel, c as createError, r as readBody } from '../../../_/nitro.mjs';
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
  if (method === "GET") {
    const data = await CustomerModel.findById(id) || createError({ statusCode: 404, statusMessage: "Not Found" });
    return {
      data,
      status: true,
      message: "Get success"
    };
  }
  if (method === "PUT") {
    try {
      const body = await readBody(event);
      console.log("PUT request body:", body);
      if (!body.full_name) body.full_name = "";
      if (!body.contact_info) body.contact_info = {};
      if (!body.medical_profile) body.medical_profile = {
        chronic_conditions: [],
        allergies: [],
        current_medications: []
      };
      const updated = await CustomerModel.findByIdAndUpdate(id, body, { new: true }) || createError({ statusCode: 404, statusMessage: "Not Found" });
      return {
        data: updated,
        status: true,
        message: "Update success"
      };
    } catch (error) {
      console.error("PUT customer error:", error);
      return {
        status: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
        error
      };
    }
  }
  if (method === "DELETE") {
    const deleted = await CustomerModel.findByIdAndDelete(id) || createError({ statusCode: 404, statusMessage: "Not Found" });
    return {
      data: deleted,
      status: true,
      message: "Delete success"
    };
  }
});

export { _id_ as default };
//# sourceMappingURL=_id_.mjs.map
