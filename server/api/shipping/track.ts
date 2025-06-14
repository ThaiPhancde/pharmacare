import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const orderCode = query.order_code as string;
    
    if (!orderCode) {
      return {
        status: false,
        message: 'Thiếu mã vận đơn'
      };
    }
    
    const response = await ghnService.trackOrder(orderCode);
    
    return {
      status: true,
      data: response.data || {}
    };
  } catch (err: any) {
    console.error('Lỗi khi theo dõi đơn hàng:', err);
    return {
      status: false,
      error: err.message,
      message: 'Không thể theo dõi đơn hàng'
    };
  }
}); 