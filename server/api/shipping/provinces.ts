import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  try {
    const response = await ghnService.getProvinces();
    
    return {
      status: true,
      data: response.data || []
    };
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách tỉnh/thành phố:', err);
    return {
      status: false,
      error: err.message,
      message: 'Không thể lấy danh sách tỉnh/thành phố'
    };
  }
}); 