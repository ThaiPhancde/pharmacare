import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const districtId = parseInt(query.district_id as string);
    
    if (!districtId) {
      return {
        status: false,
        message: 'Thiếu tham số district_id'
      };
    }
    
    const response = await ghnService.getWards(districtId);
    
    return {
      status: true,
      data: response.data || []
    };
  } catch (err: any) {
    console.error('Lỗi khi lấy danh sách phường/xã:', err);
    return {
      status: false,
      error: err.message,
      message: 'Không thể lấy danh sách phường/xã'
    };
  }
}); 