import { d as defineEventHandler } from '../../../_/nitro.mjs';
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

const token = defineEventHandler(async (event) => {
  const GHN_TOKEN = process.env.GHN_TOKEN || "bbcba577-34da-11f0-9b81-222185cb68c8";
  const SHOP_ID = process.env.GHN_SHOP_ID || "196867";
  return {
    status: true,
    data: {
      token: GHN_TOKEN,
      shop_id: SHOP_ID
    },
    message: "Th\xF4ng tin GHN token hi\u1EC7n t\u1EA1i"
  };
});

export { token as default };
//# sourceMappingURL=token.mjs.map
