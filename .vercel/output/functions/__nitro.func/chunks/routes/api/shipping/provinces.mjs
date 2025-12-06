import { d as defineEventHandler } from '../../../_/nitro.mjs';
import { b as getProvinces } from '../../../_/ghn.mjs';
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
import 'axios';

const provinces = defineEventHandler(async (event) => {
  try {
    const response = await getProvinces();
    return {
      status: true,
      data: response.data || []
    };
  } catch (err) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch t\u1EC9nh/th\xE0nh ph\u1ED1:", err);
    return {
      status: false,
      error: err.message,
      message: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch t\u1EC9nh/th\xE0nh ph\u1ED1"
    };
  }
});

export { provinces as default };
//# sourceMappingURL=provinces.mjs.map
