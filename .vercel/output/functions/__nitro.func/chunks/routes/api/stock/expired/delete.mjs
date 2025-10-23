import { d as defineEventHandler, S as Stock } from '../../../../_/nitro.mjs';
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

const _delete = defineEventHandler(async (event) => {
  if (event.method !== "DELETE") {
    return {
      status: false,
      error: "Method not allowed"
    };
  }
  try {
    const today = /* @__PURE__ */ new Date();
    const result = await Stock.deleteMany({
      expiry_date: { $lt: today },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    return {
      status: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} expired medicine records`
    };
  } catch (error) {
    console.error("Error deleting expired medicines:", error);
    return {
      status: false,
      error: "Unable to delete expired medicines"
    };
  }
});

export { _delete as default };
//# sourceMappingURL=delete.mjs.map
