import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const provinceId = parseInt(query.province_id as string);
    
    if (!provinceId) {
      return {
        status: false,
        message: 'Thiếu tham số province_id'
      };
    }
    
    const response = await ghnService.getDistricts(provinceId);
    
    return {
      status: true,
      data: response.data || []
    };
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách quận/huyện:', err);
    return {
      status: false,
      error: err.message,
      message: 'Không thể lấy danh sách quận/huyện'
    };
  }
}); 