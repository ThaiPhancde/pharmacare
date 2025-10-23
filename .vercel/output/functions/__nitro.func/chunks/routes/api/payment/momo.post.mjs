import { d as defineEventHandler, r as readBody, c as createError } from '../../../_/nitro.mjs';
import crypto from 'crypto';
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

const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/payment/callback",
  ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:3000/api/payment/momo/ipn",
  requestType: "payWithMethod",
  orderInfo: "PharmaCare Payment",
  lang: "vi"
};
const momo_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.amount) {
      throw createError({
        statusCode: 400,
        statusMessage: "Amount is required"
      });
    }
    const requestId = `${momoConfig.partnerCode}_${Date.now()}`;
    const orderId = body.orderId || `INV-CUS-${Date.now()}`;
    const amount = body.amount.toString();
    const orderInfo = body.orderInfo || momoConfig.orderInfo;
    const extraData = body.extraData || "";
    const autoCapture = true;
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;
    const signature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      partnerName: "PharmaCare",
      storeId: "PharmaCare",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      lang: momoConfig.lang,
      requestType: momoConfig.requestType,
      autoCapture,
      extraData,
      signature
    };
    const momoUrl = "https://test-payment.momo.vn/v2/gateway/api/create";
    const response = await $fetch(momoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(requestBody)).toString()
      },
      body: requestBody
    });
    if (response.resultCode === 0) {
      return {
        status: true,
        data: {
          payUrl: response.payUrl,
          deeplink: response.deeplink,
          qrCodeUrl: response.qrCodeUrl,
          requestId,
          orderId
        },
        message: "MoMo payment URL created successfully"
      };
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: response.message || "MoMo payment creation failed"
      });
    }
  } catch (error) {
    console.error("MoMo payment error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to create MoMo payment"
    });
  }
});

export { momo_post as default };
//# sourceMappingURL=momo.post.mjs.map
