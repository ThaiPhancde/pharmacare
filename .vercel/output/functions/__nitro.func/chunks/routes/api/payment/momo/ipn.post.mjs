import { d as defineEventHandler, r as readBody, I as Invoice } from '../../../../_/nitro.mjs';
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
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO"
};
const ipn_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
    const signature = crypto.createHmac("sha256", momoConfig.secretKey).update(rawSignature).digest("hex");
    if (signature !== body.signature) {
      console.error("Invalid MoMo IPN signature");
      return { statusCode: 400, message: "Invalid signature" };
    }
    if (body.resultCode === 0) {
      const normalizedOrderId = body.orderId.replace(/\s+/g, "-").toUpperCase();
      console.log(`[IPN] Processing successful payment for order ${normalizedOrderId}`);
      const invoice = await Invoice.findOne({ _id: normalizedOrderId });
      if (invoice) {
        console.log(`[IPN] Found invoice ${normalizedOrderId}, updating payment status`);
        invoice.payment_status = "paid";
        invoice.paid = invoice.grand_total;
        invoice.due = 0;
        invoice.payment_details = {
          ...invoice.payment_details || {},
          momo_transaction_id: body.transId,
          momo_request_id: body.requestId,
          payment_time: new Date(body.responseTime)
        };
        await invoice.save();
        console.log(`[IPN] MoMo payment successful for invoice ${normalizedOrderId}`);
      } else {
        console.log(`[IPN] Invoice ${normalizedOrderId} not found, creating placeholder`);
        await Invoice.create({
          _id: normalizedOrderId,
          date: /* @__PURE__ */ new Date(),
          items: [],
          subtotal: 0,
          grand_total: parseInt(body.amount),
          paid: parseInt(body.amount),
          due: 0,
          payment_method: "momo",
          payment_status: "paid",
          payment_details: {
            momo_transaction_id: body.transId,
            momo_request_id: body.requestId,
            payment_time: new Date(body.responseTime),
            is_placeholder: true
            // Mark this as a placeholder to be filled later
          },
          is_pos: true
        });
        console.log(`[IPN] Created placeholder invoice for ${normalizedOrderId}`);
      }
    } else {
      const normalizedOrderId = body.orderId.replace(/\s+/g, "-").toUpperCase();
      console.log(`[IPN] MoMo payment failed for order ${normalizedOrderId}: ${body.message}`);
      const invoice = await Invoice.findOne({ _id: normalizedOrderId });
      if (invoice) {
        invoice.payment_status = "failed";
        invoice.payment_details = {
          ...invoice.payment_details || {},
          error_message: body.message,
          error_code: body.resultCode
        };
        await invoice.save();
        console.log(`[IPN] Updated invoice ${normalizedOrderId} to failed status`);
      }
    }
    return { statusCode: 204 };
  } catch (error) {
    console.error("MoMo IPN error:", error);
    return { statusCode: 500, message: "Internal server error" };
  }
});

export { ipn_post as default };
//# sourceMappingURL=ipn.post.mjs.map
