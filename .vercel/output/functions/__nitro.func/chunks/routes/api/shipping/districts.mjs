import { d as defineEventHandler, a as getQuery } from '../../../_/nitro.mjs';
import { g as getDistricts } from '../../../_/ghn.mjs';
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

const districts = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const provinceId = parseInt(query.province_id);
    if (!provinceId) {
      return {
        status: false,
        message: "Thi\u1EBFu tham s\u1ED1 province_id"
      };
    }
    const response = await getDistricts(provinceId);
    return {
      status: true,
      data: response.data || []
    };
  } catch (err) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch qu\u1EADn/huy\u1EC7n:", err);
    return {
      status: false,
      error: err.message,
      message: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch qu\u1EADn/huy\u1EC7n"
    };
  }
});

export { districts as default };
//# sourceMappingURL=districts.mjs.map
