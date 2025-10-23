import { d as defineEventHandler, a as getQuery, i as CustomerModel, r as readBody } from '../../_/nitro.mjs';
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

const index = defineEventHandler(async (event) => {
  const method = event.method;
  if (method === "GET") {
    try {
      const query = getQuery(event);
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;
      console.log(`Fetching customers - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
      const [data, total] = await Promise.all([
        CustomerModel.find().skip(skip).limit(limit).lean(),
        CustomerModel.countDocuments()
      ]);
      console.log(`Found ${data.length} customer records out of ${total} total`);
      const processedData = data.map((customer) => {
        if (customer.medical_profile) {
          if (!Array.isArray(customer.medical_profile.chronic_conditions)) {
            customer.medical_profile.chronic_conditions = [];
          }
          if (!Array.isArray(customer.medical_profile.allergies)) {
            customer.medical_profile.allergies = [];
          }
          if (!Array.isArray(customer.medical_profile.current_medications)) {
            customer.medical_profile.current_medications = [];
          }
        } else {
          customer.medical_profile = {
            chronic_conditions: [],
            allergies: [],
            current_medications: []
          };
        }
        return customer;
      });
      return {
        data: processedData,
        total,
        status: true,
        message: "Get data successfully"
      };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return {
        data: [],
        total: 0,
        status: false,
        message: error instanceof Error ? error.message : "Failed to fetch customers"
      };
    }
  }
  if (method === "POST") {
    try {
      const body = await readBody(event);
      console.log("Received body:", body);
      if (!body.full_name) body.full_name = "";
      if (!body.contact_info) body.contact_info = {};
      if (!body.medical_profile) body.medical_profile = {
        chronic_conditions: [],
        allergies: [],
        current_medications: []
      };
      body.created_at = /* @__PURE__ */ new Date();
      console.log("Processed body:", body);
      const dataResponse = await CustomerModel.create(body);
      return {
        data: dataResponse,
        status: true,
        message: "Created success"
      };
    } catch (error) {
      console.error("POST customer error:", error);
      return {
        status: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
        error
      };
    }
  }
});

export { index as default };
//# sourceMappingURL=index4.mjs.map
