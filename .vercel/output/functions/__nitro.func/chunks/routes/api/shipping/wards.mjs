import { d as defineEventHandler, a as getQuery } from '../../../_/nitro.mjs';
import { d as getWards } from '../../../_/ghn.mjs';
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

const wards = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const districtId = parseInt(query.district_id);
    if (!districtId) {
      return {
        status: false,
        message: "Thi\u1EBFu tham s\u1ED1 district_id"
      };
    }
    const response = await getWards(districtId);
    return {
      status: true,
      data: response.data || []
    };
  } catch (err) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch ph\u01B0\u1EDDng/x\xE3:", err);
    return {
      status: false,
      error: err.message,
      message: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch ph\u01B0\u1EDDng/x\xE3"
    };
  }
});

export { wards as default };
//# sourceMappingURL=wards.mjs.map
