import { k as useRuntimeConfig } from './nitro.mjs';
import axios from 'axios';

const config = useRuntimeConfig();
const GHN_API_BASE_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api";
const GHN_TOKEN = config.ghnToken;
const GHN_SHOP_ID = parseInt(config.ghnShopId || "0", 10);
const getProvinces = async () => {
  var _a;
  try {
    const url = `${GHN_API_BASE_URL}/master-data/province`;
    console.log("\u0110ang g\u1ECDi API l\u1EA5y t\u1EC9nh th\xE0nh: ", url);
    console.log("Token GHN: ", GHN_TOKEN);
    console.log("Shop ID: ", GHN_SHOP_ID);
    const response = await axios.get(url, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json"
      }
    });
    console.log("K\u1EBFt qu\u1EA3 API t\u1EC9nh th\xE0nh: ", response.data);
    return response.data;
  } catch (error) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch t\u1EC9nh/th\xE0nh ph\u1ED1:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_a = error.response) == null ? void 0 : _a.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};
const getDistricts = async (provinceId) => {
  var _a;
  try {
    const response = await axios.get(`${GHN_API_BASE_URL}/master-data/district`, {
      params: {
        province_id: provinceId
      },
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch qu\u1EADn/huy\u1EC7n:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_a = error.response) == null ? void 0 : _a.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};
const getWards = async (districtId) => {
  var _a;
  try {
    const response = await axios.get(`${GHN_API_BASE_URL}/master-data/ward`, {
      params: {
        district_id: districtId
      },
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("L\u1ED7i khi l\u1EA5y danh s\xE1ch ph\u01B0\u1EDDng/x\xE3:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_a = error.response) == null ? void 0 : _a.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};
const calculateShippingFee = async (data) => {
  var _a, _b, _c, _d;
  try {
    const availPayload = {
      shop_id: GHN_SHOP_ID,
      from_district: 1572,
      to_district: data.district_id
    };
    const availRes = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/available-services`, availPayload, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json",
        "ShopId": GHN_SHOP_ID.toString()
      }
    });
    const services = ((_a = availRes.data) == null ? void 0 : _a.data) || [];
    if (!services.length) {
      throw new Error("GHN kh\xF4ng tr\u1EA3 v\u1EC1 d\u1ECBch v\u1EE5 kh\u1EA3 d\u1EE5ng cho tuy\u1EBFn \u0111\u01B0\u1EDDng n\xE0y");
    }
    let chosenServiceId = data.service_id;
    if (!chosenServiceId) {
      chosenServiceId = services[0].service_id;
    } else if (!services.find((s) => s.service_id === data.service_id)) {
      chosenServiceId = services[0].service_id;
    }
    const payload = {
      shop_id: GHN_SHOP_ID,
      service_id: chosenServiceId,
      to_ward_code: data.ward_code,
      to_district_id: data.district_id,
      from_district_id: 1572,
      weight: data.weight || 500,
      length: data.length || 10,
      width: data.width || 10,
      height: data.height || 10
    };
    console.log("Payload t\xEDnh ph\xED GHN:", payload);
    const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/fee`, payload, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json",
        "ShopId": GHN_SHOP_ID.toString()
      }
    });
    return {
      ...response.data,
      leadtime: (_c = (_b = response.data) == null ? void 0 : _b.data) == null ? void 0 : _c.leadtime
      // leadtime là timestamp epoch giây
    };
  } catch (error) {
    console.error("L\u1ED7i khi t\xEDnh ph\xED v\u1EADn chuy\u1EC3n:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_d = error.response) == null ? void 0 : _d.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};
const createShippingOrder = async (orderData) => {
  var _a, _b;
  try {
    const availRes = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/available-services`, {
      shop_id: GHN_SHOP_ID,
      from_district: 1572,
      to_district: orderData.district_id
    }, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json",
        "ShopId": GHN_SHOP_ID.toString()
      }
    });
    const services = ((_a = availRes.data) == null ? void 0 : _a.data) || [];
    if (!services.length) {
      throw new Error("GHN kh\xF4ng h\u1ED7 tr\u1EE3 tuy\u1EBFn \u0111\u01B0\u1EDDng n\xE0y (kh\xF4ng c\xF3 d\u1ECBch v\u1EE5 kh\u1EA3 d\u1EE5ng)");
    }
    let chosenServiceId = orderData.service_id;
    if (!chosenServiceId || !services.find((s) => s.service_id === chosenServiceId)) {
      chosenServiceId = services[0].service_id;
    }
    const items = orderData.items || [];
    if (!items.length) {
      items.push({
        name: "S\u1EA3n ph\u1EA9m",
        quantity: 1,
        weight: orderData.weight || 500
      });
    }
    const paymentTypeId = orderData.payment_type_id || 1;
    const codAmount = orderData.cod_amount || 0;
    const payload = {
      shop_id: GHN_SHOP_ID,
      payment_type_id: paymentTypeId,
      required_note: orderData.required_note || "KHONGCHOXEMHANG",
      to_name: orderData.recipient_name,
      to_phone: orderData.recipient_phone,
      to_address: orderData.recipient_address,
      to_ward_code: orderData.ward_code,
      to_district_id: orderData.district_id,
      from_district_id: 1572,
      from_ward_code: "550307",
      from_name: "PharmaCare",
      from_phone: "0569083547",
      from_address: "39 Nguy\u1EC5n Th\u1ECB Minh Khai",
      return_phone: "0569083547",
      return_address: "39 Nguy\u1EC5n Th\u1ECB Minh Khai",
      return_district_id: 1572,
      return_ward_code: "550307",
      weight: orderData.weight || 500,
      length: orderData.length || 10,
      width: orderData.width || 10,
      height: orderData.height || 10,
      service_id: chosenServiceId,
      service_type_id: 2,
      cod_amount: codAmount,
      content: "\u0110\u01A1n h\xE0ng PharmaCare",
      items
    };
    console.log("\u0110ang g\u1EEDi request t\u1EA1o \u0111\u01A1n h\xE0ng:", payload);
    const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/create`, payload, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json",
        "ShopId": GHN_SHOP_ID.toString()
      }
    });
    return response.data;
  } catch (error) {
    console.error("L\u1ED7i khi t\u1EA1o \u0111\u01A1n h\xE0ng GHN:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_b = error.response) == null ? void 0 : _b.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};
const trackOrder = async (orderCode) => {
  var _a;
  try {
    const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/detail`, {
      order_code: orderCode
    }, {
      headers: {
        "Token": GHN_TOKEN,
        "Content-Type": "application/json",
        "ShopId": GHN_SHOP_ID.toString()
      }
    });
    return response.data;
  } catch (error) {
    console.error("L\u1ED7i khi theo d\xF5i \u0111\u01A1n h\xE0ng:", error.message);
    console.error("Chi ti\u1EBFt l\u1ED7i:", ((_a = error.response) == null ? void 0 : _a.data) || "Kh\xF4ng c\xF3 chi ti\u1EBFt");
    throw error;
  }
};

export { createShippingOrder as a, getProvinces as b, calculateShippingFee as c, getWards as d, getDistricts as g, trackOrder as t };
//# sourceMappingURL=ghn.mjs.map
