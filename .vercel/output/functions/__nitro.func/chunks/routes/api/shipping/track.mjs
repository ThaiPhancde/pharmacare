import { d as defineEventHandler, a as getQuery } from '../../../_/nitro.mjs';
import { t as trackOrder } from '../../../_/ghn.mjs';
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

const track = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const orderCode = query.order_code;
    if (!orderCode) {
      return {
        status: false,
        message: "Thi\u1EBFu m\xE3 v\u1EADn \u0111\u01A1n"
      };
    }
    const response = await trackOrder(orderCode);
    return {
      status: true,
      data: response.data || {}
    };
  } catch (err) {
    console.error("L\u1ED7i khi theo d\xF5i \u0111\u01A1n h\xE0ng:", err);
    return {
      status: false,
      error: err.message,
      message: "Kh\xF4ng th\u1EC3 theo d\xF5i \u0111\u01A1n h\xE0ng"
    };
  }
});

export { track as default };
//# sourceMappingURL=track.mjs.map
