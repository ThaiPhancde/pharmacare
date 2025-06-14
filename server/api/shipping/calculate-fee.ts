import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  if (event.method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.district_id || !body.ward_code) {
        return {
          status: false,
          message: 'Thiếu thông tin quận/huyện hoặc phường/xã'
        };
      }
      
      const calcRes = await ghnService.calculateShippingFee({
        service_id: body.service_id,
        district_id: body.district_id,
        ward_code: body.ward_code,
        weight: body.weight || 500,
        length: body.length || 10,
        width: body.width || 10,
        height: body.height || 10
      });

      const feeData = calcRes?.data || {};
      const leadtime = calcRes.leadtime;
      let formattedLeadTime = '';
      if (leadtime) {
        const date = new Date(leadtime * 1000);
        formattedLeadTime = date.toLocaleDateString('vi-VN');
      }

      return {
        status: true,
        data: {
          total: feeData.total || feeData.service_fee || 0,
          expected_delivery_time: formattedLeadTime
        }
      };
    } catch (err: any) {
      console.error('Lỗi khi tính phí vận chuyển:', err);
      return {
        status: false,
        error: err.message,
        message: 'Không thể tính phí vận chuyển'
      };
    }
  }
  
  return {
    status: false,
    message: 'Method not allowed'
  };
}); 