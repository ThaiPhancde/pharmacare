import axios from 'axios';

// GHN configuration
const config = useRuntimeConfig();

const GHN_API_BASE_URL = 'https://dev-online-gateway.ghn.vn/shiip/public-api';
// const GHN_API_BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api/v2'; // Production
const GHN_TOKEN = config.ghnToken;
const GHN_SHOP_ID = parseInt(config.ghnShopId || '0', 10);

// Lấy danh sách tỉnh/thành phố
export const getProvinces = async () => {
  try {
    const url = `${GHN_API_BASE_URL}/master-data/province`;
    console.log('Đang gọi API lấy tỉnh thành: ', url);
    console.log('Token GHN: ', GHN_TOKEN);
    console.log('Shop ID: ', GHN_SHOP_ID);
    
    const response = await axios.get(url, {
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Kết quả API tỉnh thành: ', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

// Lấy danh sách quận/huyện theo tỉnh/thành phố
export const getDistricts = async (provinceId: number) => {
  try {
    const response = await axios.get(`${GHN_API_BASE_URL}/master-data/district`, {
      params: {
        province_id: provinceId
      },
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách quận/huyện:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

// Lấy danh sách phường/xã theo quận/huyện
export const getWards = async (districtId: number) => {
  try {
    const response = await axios.get(`${GHN_API_BASE_URL}/master-data/ward`, {
      params: {
        district_id: districtId
      },
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách phường/xã:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

// Tính phí vận chuyển
export const calculateShippingFee = async (data: any) => {
  try {
      // 1) Lấy danh sách dịch vụ khả dụng cho tuyến đường
      const availPayload = {
        shop_id: GHN_SHOP_ID,
        from_district: 1572,
        to_district: data.district_id
      };
      const availRes = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/available-services`, availPayload, {
        headers: {
          'Token': GHN_TOKEN,
          'Content-Type': 'application/json',
          'ShopId': GHN_SHOP_ID.toString()
        }
      });
      const services = availRes.data?.data || [];
      if (!services.length) {
        throw new Error('GHN không trả về dịch vụ khả dụng cho tuyến đường này');
      }
      // Chọn dịch vụ theo yêu cầu (Express / Nhanh) hoặc lấy service đầu tiên
      let chosenServiceId = data.service_id;
      if (!chosenServiceId) {
        chosenServiceId = services[0].service_id;
      } else if (!services.find((s: any) => s.service_id === data.service_id)) {
        // Nếu service_id người dùng chọn không nằm trong danh sách, fallback
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
      
      console.log('Payload tính phí GHN:', payload);
      
      const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/fee`, payload, {
        headers: {
          'Token': GHN_TOKEN,
          'Content-Type': 'application/json',
          'ShopId': GHN_SHOP_ID.toString()
        }
      });
      // Trả về cả fee và leadtime (thời gian giao dự kiến)
      return {
        ...response.data,
        leadtime: response.data?.data?.leadtime // leadtime là timestamp epoch giây
      };
  } catch (error: any) {
    console.error('Lỗi khi tính phí vận chuyển:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

// Tạo đơn hàng vận chuyển
export const createShippingOrder = async (orderData: any) => {
  try {
    // 1) Lấy danh sách dịch vụ khả dụng
    const availRes = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/available-services`, {
      shop_id: GHN_SHOP_ID,
      from_district: 1572,
      to_district: orderData.district_id
    }, {
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json',
        'ShopId': GHN_SHOP_ID.toString()
      }
    });
    const services = availRes.data?.data || [];
    if (!services.length) {
      throw new Error('GHN không hỗ trợ tuyến đường này (không có dịch vụ khả dụng)');
    }
    // Chọn dịch vụ phù hợp
    let chosenServiceId = orderData.service_id;
    if (!chosenServiceId || !services.find((s: any) => s.service_id === chosenServiceId)) {
      chosenServiceId = services[0].service_id;
    }

    // Chuẩn bị danh sách items cho GHN
    const items = orderData.items.map((item: any) => ({
      name: item.name || 'Sản phẩm',
      quantity: item.quantity || 1,
      weight: item.weight || 500 / orderData.items.length
    }));

    const payload = {
      shop_id: GHN_SHOP_ID,
      payment_type_id: 2,
      required_note: orderData.required_note || 'KHONGCHOXEMHANG',
      to_name: orderData.recipient_name,
      to_phone: orderData.recipient_phone,
      to_address: orderData.recipient_address,
      to_ward_code: orderData.ward_code,
      to_district_id: orderData.district_id,
      from_district_id: 1572,
      from_ward_code: '550307',
      from_name: 'PharmaCare',
      from_phone: '0569083547',
      from_address: '39 Nguyễn Thị Minh Khai',
      return_phone: '0569083547',
      return_address: '39 Nguyễn Thị Minh Khai',
      return_district_id: 1572,
      return_ward_code: '550307',
      weight: orderData.weight || 500,
      length: orderData.length || 10,
      width: orderData.width || 10,
      height: orderData.height || 10,
      service_id: chosenServiceId,
      service_type_id: 2,
      content: 'Đơn hàng PharmaCare',
      items
    };

    console.log('Đang gửi request tạo đơn hàng:', payload);

    const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/create`, payload, {
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json',
        'ShopId': GHN_SHOP_ID.toString()
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi tạo đơn hàng GHN:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

// Theo dõi đơn hàng
export const trackOrder = async (orderCode: string) => {
  try {
    const response = await axios.post(`${GHN_API_BASE_URL}/v2/shipping-order/detail`, {
      order_code: orderCode
    }, {
      headers: {
        'Token': GHN_TOKEN,
        'Content-Type': 'application/json',
        'ShopId': GHN_SHOP_ID.toString()
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi theo dõi đơn hàng:', error.message);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');
    throw error;
  }
};

export const testConnection = async () => {
  const config = useRuntimeConfig();
  const urlsToTest = [
    { name: 'GHN Production - Province', url: 'https://online-gateway.ghn.vn/shiip/public-api/master-data/province' },
    { name: 'GHN Development - Province', url: 'https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province' },
    { name: 'GHN Development - Create Order Path (for testing)', url: 'https://dev-online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create' }
  ];

  const results = [];
  const token = config.ghnToken;
  const shopId = config.ghnShopId;

  if (!token || !shopId) {
    return {
      error: 'GHN_TOKEN or GHN_SHOP_ID is not defined in .env file.'
    };
  }

  for (const item of urlsToTest) {
    try {
      // For path testing, we don't need a full valid request, just to see if the path exists
      const isPathTest = item.name.includes('Path');
      const requestMethod = isPathTest ? axios.head : axios.get;
      
      const response = await requestMethod(item.url, {
        headers: {
          'Token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      });
      results.push({
        name: item.name,
        url: item.url,
        status: response.status,
        statusText: response.statusText,
        data: response.data?.message || 'Success'
      });
    } catch (error: any) {
      results.push({
        name: item.name,
        url: item.url,
        status: error.response?.status || 'Error',
        statusText: error.response?.statusText || error.message,
        data: error.response?.data || 'No response data'
      });
    }
  }

  return {
    message: 'Test completed.',
    tokenUsed: `...${token.substring(token.length - 6)}`,
    shopIdUsed: shopId,
    results
  };
};