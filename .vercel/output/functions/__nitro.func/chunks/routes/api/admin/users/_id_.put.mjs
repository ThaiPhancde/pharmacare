import { d as defineEventHandler, g as getRouterParam, r as readBody, U as User, c as createError } from '../../../../_/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "id");
  const body = await readBody(event);
  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive
    },
    { new: true }
  ).select("-password");
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }
  return {
    data: user,
    status: true,
    message: "User updated successfully"
  };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
