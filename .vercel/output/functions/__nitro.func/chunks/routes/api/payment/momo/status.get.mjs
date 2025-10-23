import { d as defineEventHandler, a as getQuery, c as createError, I as Invoice } from '../../../../_/nitro.mjs';
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

({
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO"
});
const status_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const orderId = query.orderId;
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "orderId is required"
      });
    }
    const normalizedOrderId = String(orderId).replace(/\s+/g, "-").toUpperCase();
    console.log(`Checking payment status for normalized ID: ${normalizedOrderId} (original: ${orderId})`);
    const invoice = await Invoice.findOne({ _id: normalizedOrderId });
    console.log(`Status check result: ${invoice ? "Invoice found" : "Invoice not found"}`);
    if (invoice) {
      console.log(`Invoice details: Payment status = ${invoice.payment_status}, Method = ${invoice.payment_method}`);
    }
    if (!invoice) {
      const fallbackInvoice = await Invoice.findOne({ _id: orderId });
      if (fallbackInvoice) {
        console.log(`Found invoice using original ID format: ${orderId}`);
        return {
          status: true,
          data: {
            status: fallbackInvoice.payment_status === "paid" ? "paid" : "pending",
            payment_details: fallbackInvoice.payment_details || {},
            invoice_id: fallbackInvoice._id
          },
          message: fallbackInvoice.payment_status === "paid" ? "Payment has been completed" : "Payment is still pending"
        };
      }
      return {
        status: false,
        data: { status: "not_found" },
        message: "Invoice not found"
      };
    }
    if (invoice.payment_status === "paid") {
      return {
        status: true,
        data: {
          status: "paid",
          payment_details: invoice.payment_details || {},
          invoice_id: invoice._id
        },
        message: "Payment has been completed"
      };
    }
    return {
      status: true,
      data: {
        status: "pending",
        invoice_id: invoice._id
      },
      message: "Payment is still pending"
    };
  } catch (error) {
    console.error("MoMo status check error:", error);
    return {
      status: false,
      message: error.message || "Failed to check payment status",
      data: null
    };
  }
});

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
