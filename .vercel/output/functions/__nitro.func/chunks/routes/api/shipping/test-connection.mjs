import { d as defineEventHandler } from '../../../_/nitro.mjs';
import axios from 'axios';
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

const testConnection = defineEventHandler(async (event) => {
  const GHN_TOKEN = process.env.GHN_TOKEN || "bbcba577-34da-11f0-9b81-222185cb68c8";
  const SHOP_ID = parseInt(process.env.GHN_SHOP_ID || "196867");
  const apiUrls = [
    "https://online-gateway.ghn.vn/shiip/public-api/v2",
    "https://dev-online-gateway.ghn.vn/shiip/public-api/v2",
    "https://fe-online-gateway.ghn.vn/shiip/public-api/v2"
  ];
  const results = {};
  for (const baseUrl of apiUrls) {
    try {
      const url = `${baseUrl}/master-data/province`;
      console.log(`Testing connection to: ${url}`);
      const response = await axios.get(url, {
        headers: {
          "Token": GHN_TOKEN,
          "Content-Type": "application/json"
        },
        timeout: 5e3
        // 5 giây timeout
      });
      results[baseUrl] = {
        status: "success",
        statusCode: response.status,
        data: response.data
      };
    } catch (error) {
      results[baseUrl] = {
        status: "error",
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : "No response"
      };
    }
  }
  const shopIdResults = {};
  const workingUrl = Object.keys(results).find((url) => results[url].status === "success");
  if (workingUrl) {
    try {
      const response = await axios.get(`${workingUrl}/shop/detail`, {
        headers: {
          "Token": GHN_TOKEN,
          "Content-Type": "application/json",
          "ShopId": SHOP_ID.toString()
        },
        timeout: 5e3
      });
      shopIdResults.status = "success";
      shopIdResults.data = response.data;
    } catch (error) {
      shopIdResults.status = "error";
      shopIdResults.message = error.message;
      shopIdResults.response = error.response ? {
        status: error.response.status,
        data: error.response.data
      } : "No response";
    }
  }
  return {
    status: true,
    data: {
      token: GHN_TOKEN.toString().substring(0, 5) + "...",
      shop_id: SHOP_ID,
      api_urls_test: results,
      shop_id_test: shopIdResults
    }
  };
});

export { testConnection as default };
//# sourceMappingURL=test-connection.mjs.map
