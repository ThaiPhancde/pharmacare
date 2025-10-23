import { d as defineEventHandler, r as readBody, I as Invoice } from '../../../../_/nitro.mjs';
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

const payment_patch = defineEventHandler(async (event) => {
  try {
    const { id: rawId } = event.context.params || {};
    const body = await readBody(event);
    if (!rawId) {
      return {
        status: false,
        message: "Invoice ID is required"
      };
    }
    const id = decodeURIComponent(rawId).replace(/\s+/g, "-").toUpperCase();
    console.log(`Updating payment status for invoice ID: ${id} (original: ${rawId})`);
    console.log(`Update data:`, body);
    if (!body.payment_status) {
      return {
        status: false,
        message: "Payment status is required"
      };
    }
    const invoice = await Invoice.findOne({ _id: id });
    if (!invoice) {
      console.log(`Invoice not found with ID: ${id}`);
      return {
        status: false,
        message: "Invoice not found"
      };
    }
    if (body.payment_status) {
      invoice.payment_status = body.payment_status;
    }
    if (body.paid !== void 0) {
      invoice.paid = body.paid;
    }
    if (body.due !== void 0) {
      invoice.due = body.due;
    }
    if (body.payment_details) {
      invoice.payment_details = {
        ...invoice.payment_details || {},
        ...body.payment_details
      };
    }
    await invoice.save();
    console.log(`Invoice ${id} payment status updated to ${body.payment_status}`);
    return {
      status: true,
      message: "Invoice payment status updated successfully",
      data: {
        _id: invoice._id,
        payment_status: invoice.payment_status,
        paid: invoice.paid,
        due: invoice.due
      }
    };
  } catch (error) {
    console.error("Error updating invoice payment status:", error);
    return {
      status: false,
      message: "Failed to update invoice payment status"
    };
  }
});

export { payment_patch as default };
//# sourceMappingURL=payment.patch.mjs.map
