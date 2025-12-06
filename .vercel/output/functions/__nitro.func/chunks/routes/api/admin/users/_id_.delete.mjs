import { d as defineEventHandler, g as getRouterParam, U as User, c as createError } from '../../../../_/nitro.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");
  const user = await User.findById(userId);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  if (user.role === "admin") {
    throw createError({ statusCode: 403, statusMessage: "Cannot delete admin user" });
  }
  await User.findByIdAndDelete(userId);
  return {
    data: null,
    status: true,
    message: "User deleted successfully"
  };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
