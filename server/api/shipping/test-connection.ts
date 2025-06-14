import axios from 'axios';

interface ApiResult {
  status: string;
  statusCode?: number;
  data?: any;
  message?: string;
  response?: {
    status: number;
    data: any;
  } | string;
}

interface ShopResult {
  status?: string;
  data?: any;
  message?: string;
  response?: {
    status: number;
    data: any;
  } | string;
}

export default defineEventHandler(async (event) => {
  // Lấy thông tin từ biến môi trường hoặc giá trị mặc định
  const GHN_TOKEN = process.env.GHN_TOKEN || 'bbcba577-34da-11f0-9b81-222185cb68c8';
  const SHOP_ID = parseInt(process.env.GHN_SHOP_ID || '196867');
  
  // Mảng các URL API để kiểm tra
  const apiUrls = [
    'https://online-gateway.ghn.vn/shiip/public-api/v2',
    'https://dev-online-gateway.ghn.vn/shiip/public-api/v2',
    'https://fe-online-gateway.ghn.vn/shiip/public-api/v2'
  ];
  
  const results: Record<string, ApiResult> = {};
  
  // Kiểm tra từng URL
  for (const baseUrl of apiUrls) {
    try {
      const url = `${baseUrl}/master-data/province`;
      console.log(`Testing connection to: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Token': GHN_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 giây timeout
      });
      
      results[baseUrl] = {
        status: 'success',
        statusCode: response.status,
        data: response.data
      };
    } catch (error: any) {
      results[baseUrl] = {
        status: 'error',
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : 'No response'
      };
    }
  }
  
  // Kiểm tra shop_id
  const shopIdResults: ShopResult = {};
  const workingUrl = Object.keys(results).find(url => results[url].status === 'success');
  
  if (workingUrl) {
    try {
      const response = await axios.get(`${workingUrl}/shop/detail`, {
        headers: {
          'Token': GHN_TOKEN,
          'Content-Type': 'application/json',
          'ShopId': SHOP_ID.toString()
        },
        timeout: 5000
      });
      
      shopIdResults.status = 'success';
      shopIdResults.data = response.data;
    } catch (error: any) {
      shopIdResults.status = 'error';
      shopIdResults.message = error.message;
      shopIdResults.response = error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response';
    }
  }
  
  return {
    status: true,
    data: {
      token: GHN_TOKEN.toString().substring(0, 5) + '...',
      shop_id: SHOP_ID,
      api_urls_test: results,
      shop_id_test: shopIdResults
    }
  };
}); 