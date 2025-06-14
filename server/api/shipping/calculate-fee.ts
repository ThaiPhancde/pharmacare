import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  if (event.method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.district_id || !body.ward_code) {
        return {
          status: false,
          message: 'Thiếu thông tin quận/huyện hoặc phường/xã',
          data: {
            total: 0,
            expected_delivery_time: '1-3 ngày'
          }
        };
      }
      
      // Determine if it's HCM city first for fallback
      const isHCMCity = body.district_id >= 1442 && body.district_id <= 1480;
      let formattedLeadTime = isHCMCity ? 'Trong ngày (3-5 tiếng)' : '1-3 ngày';
      
      // Default shipping fees
      let shippingFee = isHCMCity ? 20500 : 30000;
      
      try {
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
        // Only update the fee if we got a valid response
        if (feeData.total || feeData.service_fee) {
          shippingFee = feeData.total || feeData.service_fee || shippingFee;
        }
        
        const leadtime = calcRes.leadtime;
        
        console.log('Leadtime from GHN:', leadtime);
        console.log('District ID:', body.district_id);
        
        // Custom delivery time calculation
        if (isHCMCity) {
          // For HCM city: same day delivery (3-5 hours)
          formattedLeadTime = `Trong ngày (3-5 tiếng)`;
          console.log('HCM city detected, using same day delivery time');
        } else if (leadtime) {
          try {
            // For other locations: calculate based on leadtime from GHN or use +1-2 days
            const date = new Date(leadtime * 1000);
            
            // Check if date is valid
            if (!isNaN(date.getTime())) {
              // Calculate days difference from now
              const now = new Date();
              const diffTime = Math.abs(date.getTime() - now.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 1) {
                formattedLeadTime = `1-2 ngày`;
              } else {
                formattedLeadTime = `${diffDays}-${diffDays+1} ngày`;
              }
              
              console.log('Calculated delivery time:', formattedLeadTime);
            }
          } catch (dateErr) {
            console.error('Error formatting leadtime date:', dateErr);
            // Keep the default formattedLeadTime
          }
        }
        
        return {
          status: true,
          data: {
            total: shippingFee,
            expected_delivery_time: formattedLeadTime,
            raw_leadtime: leadtime // Include raw leadtime for debugging
          }
        };
      } catch (calcErr) {
        console.error('Lỗi khi tính phí vận chuyển từ GHN:', calcErr);
        
        // Even if GHN calculation fails, return a reasonable estimate with default values
        return {
          status: true, // Return success status to avoid UI errors
          message: 'Sử dụng phí vận chuyển mặc định',
          data: {
            total: shippingFee,
            expected_delivery_time: formattedLeadTime
          }
        };
      }
    } catch (err: any) {
      console.error('Lỗi khi xử lý yêu cầu tính phí vận chuyển:', err);
      
      // Determine if it's HCM city for fallback
      let formattedLeadTime = '1-3 ngày';
      let shippingFee = 30000;
      
      try {
        const body = await readBody(event);
        const isHCMCity = body.district_id >= 1442 && body.district_id <= 1480;
        if (isHCMCity) {
          formattedLeadTime = 'Trong ngày (3-5 tiếng)';
          shippingFee = 20500;
        }
      } catch {}
      
      return {
        status: true, // Return success to avoid UI errors
        message: 'Sử dụng phí vận chuyển mặc định',
        data: {
          total: shippingFee,
          expected_delivery_time: formattedLeadTime
        }
      };
    }
  }
  
  return {
    status: false,
    message: 'Method not allowed',
    data: {
      total: 0,
      expected_delivery_time: '1-3 ngày'
    }
  };
}); 