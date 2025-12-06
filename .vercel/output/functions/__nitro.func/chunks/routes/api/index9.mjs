import { d as defineEventHandler, a as getQuery, r as readBody, I as Invoice } from '../../_/nitro.mjs';
import mongoose, { Schema } from 'mongoose';
import { a as createShippingOrder } from '../../_/ghn.mjs';
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

const ShippingSchema = new Schema(
  {
    invoice: { type: Schema.Types.Mixed, ref: "Invoice", required: true },
    shipping_code: { type: String },
    recipient_name: { type: String, required: true },
    recipient_phone: { type: String, required: true },
    recipient_address: { type: String, required: true },
    ward_code: { type: String, required: true },
    district_id: { type: Number, required: true },
    province_id: { type: Number, required: true },
    weight: { type: Number, default: 500 },
    // mặc định 500g
    length: { type: Number, default: 10 },
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
    service_id: { type: Number, default: 53320 },
    // GHN Express
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending"
    },
    note: { type: String, default: "Thu\u1ED1c - X\u1EED l\xFD c\u1EA9n th\u1EADn" },
    expected_delivery_date: { type: Date },
    shipping_fee: { type: Number, default: 0 },
    is_cod: { type: Boolean, default: false },
    payment_method: { type: String, enum: ["prepaid", "cod"], default: "prepaid" },
    cod_amount: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
ShippingSchema.pre("save", function(next) {
  this.updated_at = /* @__PURE__ */ new Date();
  next();
});
const Shipping = mongoose.models.Shipping || mongoose.model("Shipping", ShippingSchema);

const index = defineEventHandler(async (event) => {
  var _a;
  const method = event.method;
  if (method === "GET") {
    try {
      const query = getQuery(event);
      let filter = {};
      if (query.invoice) {
        filter = { invoice: query.invoice };
      }
      const shipping = await Shipping.find(filter).populate({
        path: "invoice",
        select: "_id invoice_no date customer items grand_total"
      }).sort({ created_at: -1 });
      const processedShipping = shipping.map((item) => {
        const doc = item.toObject();
        if (doc.invoice && typeof doc.invoice === "object") {
          doc.invoice_display = doc.invoice.invoice_no || doc.invoice._id;
        } else {
          doc.invoice_display = doc.invoice;
        }
        return doc;
      });
      return { status: true, data: processedShipping };
    } catch (err) {
      console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch shipping:", err);
      return {
        status: false,
        error: err.message,
        message: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch shipping"
      };
    }
  }
  if (method === "POST") {
    try {
      const body = await readBody(event);
      let invoice;
      try {
        invoice = await Invoice.findById(body.invoice);
      } catch {
      }
      if (!invoice) {
        invoice = await Invoice.findOne({ invoice_no: body.invoice });
      }
      if (!invoice) {
        return {
          status: false,
          message: "Invoice kh\xF4ng t\u1ED3n t\u1EA1i"
        };
      }
      const itemDetails = invoice.items.map((item) => {
        let medicineName = "Thu\u1ED1c";
        if (item.medicine) {
          if (typeof item.medicine === "object" && item.medicine.name) {
            medicineName = item.medicine.name;
          } else if (typeof item.medicine === "string") {
            medicineName = item.medicine_name || "Thu\u1ED1c";
          }
        } else if (item.medicine_name) {
          medicineName = item.medicine_name;
        }
        const quantity = item.quantity || 1;
        const batchInfo = item.batch_id ? ` - Batch: ${item.batch_id}` : "";
        console.log(`Creating shipping item: ${medicineName} x ${quantity}${batchInfo}`);
        return {
          name: `${medicineName} x ${quantity}${batchInfo}`,
          quantity: item.quantity || 1,
          weight: Math.round(body.weight / invoice.items.length)
          // Distribute weight among items
        };
      });
      const isCOD = body.payment_method === "cod";
      const codAmount = isCOD ? body.cod_amount || 0 : 0;
      const orderData = {
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone,
        recipient_address: body.recipient_address,
        ward_code: body.ward_code,
        district_id: body.district_id,
        weight: body.weight || 500,
        length: body.length || 10,
        width: body.width || 10,
        height: body.height || 10,
        service_id: body.service_id || 53320,
        payment_type_id: isCOD ? 2 : 1,
        // 1: Sender pays shipping fee, 2: Receiver pays shipping fee
        cod_amount: codAmount,
        items: itemDetails
      };
      const ghnResponse = await createShippingOrder(orderData);
      if (!ghnResponse || ghnResponse.code !== 200) {
        return {
          status: false,
          error: (ghnResponse == null ? void 0 : ghnResponse.message) || "L\u1ED7i khi t\u1EA1o \u0111\u01A1n h\xE0ng GHN",
          message: "Kh\xF4ng th\u1EC3 t\u1EA1o \u0111\u01A1n v\u1EADn chuy\u1EC3n"
        };
      }
      console.log("GHN response th\xE0nh c\xF4ng:", JSON.stringify(ghnResponse));
      const shippingData = {
        ...body,
        invoice: invoice._id,
        // Ensure we store the invoice ID, not the whole object
        shipping_code: ghnResponse.data.order_code,
        shipping_fee: ghnResponse.data.total_fee,
        is_cod: isCOD,
        payment_method: body.payment_method || "prepaid",
        cod_amount: codAmount,
        status: "confirmed"
      };
      if (ghnResponse.data.expected_delivery_time) {
        try {
          let deliveryDate;
          const isHCMCity = body.district_id >= 1442 && body.district_id <= 1480;
          if (isHCMCity) {
            deliveryDate = /* @__PURE__ */ new Date();
            deliveryDate.setHours(deliveryDate.getHours() + 5);
            shippingData.expected_delivery_date = deliveryDate;
            console.log("HCM city order, setting delivery time to today + 5 hours:", deliveryDate);
          } else if (typeof ghnResponse.data.expected_delivery_time === "number") {
            deliveryDate = new Date(ghnResponse.data.expected_delivery_time * 1e3);
            if (!isNaN(deliveryDate.getTime())) {
              shippingData.expected_delivery_date = deliveryDate;
              console.log("Parsed delivery date from timestamp:", deliveryDate);
            } else {
              console.error("Invalid delivery date format from timestamp:", ghnResponse.data.expected_delivery_time);
              deliveryDate = /* @__PURE__ */ new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 2);
              shippingData.expected_delivery_date = deliveryDate;
            }
          } else {
            deliveryDate = new Date(ghnResponse.data.expected_delivery_time);
            if (!isNaN(deliveryDate.getTime())) {
              shippingData.expected_delivery_date = deliveryDate;
              console.log("Parsed delivery date from string:", deliveryDate);
            } else {
              console.error("Invalid delivery date format from string:", ghnResponse.data.expected_delivery_time);
              deliveryDate = /* @__PURE__ */ new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 2);
              shippingData.expected_delivery_date = deliveryDate;
            }
          }
        } catch (dateErr) {
          console.error("Error parsing delivery date:", dateErr);
          const defaultDate = /* @__PURE__ */ new Date();
          defaultDate.setDate(defaultDate.getDate() + 2);
          shippingData.expected_delivery_date = defaultDate;
        }
      } else {
        const defaultDate = /* @__PURE__ */ new Date();
        defaultDate.setDate(defaultDate.getDate() + 2);
        shippingData.expected_delivery_date = defaultDate;
      }
      console.log("D\u1EEF li\u1EC7u shipping tr\u01B0\u1EDBc khi l\u01B0u:", JSON.stringify(shippingData));
      try {
        const shipping = await Shipping.create(shippingData);
        console.log("Shipping \u0111\xE3 l\u01B0u th\xE0nh c\xF4ng:", shipping._id);
        return {
          status: true,
          data: shipping,
          message: "\u0110\xE3 t\u1EA1o \u0111\u01A1n v\u1EADn chuy\u1EC3n th\xE0nh c\xF4ng"
        };
      } catch (dbErr) {
        console.error("L\u1ED7i khi l\u01B0u shipping v\xE0o DB:", dbErr);
        return {
          status: true,
          // Vẫn trả về true vì đơn GHN đã tạo thành công
          ghn_data: {
            order_code: ghnResponse.data.order_code,
            expected_delivery_time: ghnResponse.data.expected_delivery_time,
            total_fee: ghnResponse.data.total_fee
          },
          message: "\u0110\xE3 t\u1EA1o \u0111\u01A1n GHN th\xE0nh c\xF4ng nh\u01B0ng kh\xF4ng l\u01B0u \u0111\u01B0\u1EE3c v\xE0o h\u1EC7 th\u1ED1ng. M\xE3 v\u1EADn \u0111\u01A1n: " + ghnResponse.data.order_code
        };
      }
    } catch (err) {
      console.error("L\u1ED7i khi t\u1EA1o shipping:", err);
      let errorMessage = "Kh\xF4ng th\u1EC3 t\u1EA1o shipping";
      if ((_a = err.response) == null ? void 0 : _a.data) {
        const ghnError = err.response.data;
        if (ghnError.message) {
          errorMessage = ghnError.message;
          if (ghnError.code_message_value) {
            errorMessage += ` (${ghnError.code_message_value})`;
          }
        }
      }
      return {
        status: false,
        error: err.message,
        message: errorMessage
      };
    }
  }
  return {
    status: false,
    message: "Method not allowed"
  };
});

export { index as default };
//# sourceMappingURL=index9.mjs.map
