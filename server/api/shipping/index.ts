import Shipping from '@/server/models/Shipping';
import Invoice from '@/server/models/Invoice';
import mongoose from 'mongoose';
import * as ghnService from '@/server/services/ghn';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // Lấy danh sách shipping
  if (method === 'GET') {
    try {
      const query = getQuery(event);
      let filter = {};
      
      // Lọc theo invoice nếu có
      if (query.invoice) {
        filter = { invoice: query.invoice };
      }
      
      const shipping = await Shipping.find(filter)
        .populate({
          path: 'invoice',
          select: '_id invoice_no date customer items grand_total'
        })
        .sort({ created_at: -1 });
        
      // Process the shipping data to ensure invoice_no is accessible
      const processedShipping = shipping.map(item => {
        const doc = item.toObject();
        // Check if invoice is populated and fix the reference
        if (doc.invoice && typeof doc.invoice === 'object') {
          // Use invoice_no if available, otherwise use _id
          doc.invoice_display = doc.invoice.invoice_no || doc.invoice._id;
        } else {
          // If invoice is just an ID
          doc.invoice_display = doc.invoice;
        }
        return doc;
      });
        
      return { status: true, data: processedShipping };
    } catch (err: any) {
      console.error('Lỗi khi lấy danh sách shipping:', err);
      return {
        status: false,
        error: err.message,
        message: 'Không thể lấy danh sách shipping'
      };
    }
  }

  // Tạo shipping mới
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Thử tìm theo _id bất kể định dạng
      let invoice;
      try {
        invoice = await Invoice.findById(body.invoice as any);
      } catch {}

      // Nếu không tìm thấy theo _id, thử theo mã hóa đơn (invoice_no)
      if (!invoice) {
        invoice = await Invoice.findOne({ invoice_no: body.invoice });
      }

      if (!invoice) {
        return {
          status: false,
          message: 'Invoice không tồn tại'
        };
      }
      
      // Gọi API GHN để tạo đơn hàng
      const orderData = {
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone,
        recipient_address: body.recipient_address,
        ward_code: body.ward_code,
        district_id: body.district_id,
        weight: body.weight || 500,
        length: body.length || 10,
        width: body.width || 10,
        height: body.height || 10,
        service_id: body.service_id || 53320,
        items: invoice.items.map((item: any) => ({
          name: 'Thuốc',
          quantity: item.quantity || 1
        }))
      };
      
      // Tạo đơn hàng trên GHN
      const ghnResponse = await ghnService.createShippingOrder(orderData);
      
      if (!ghnResponse || ghnResponse.code !== 200) {
        return {
          status: false,
          error: ghnResponse?.message || 'Lỗi khi tạo đơn hàng GHN',
          message: 'Không thể tạo đơn vận chuyển'
        };
      }
      
      // Log chi tiết response từ GHN khi thành công
      console.log('GHN response thành công:', JSON.stringify(ghnResponse));
      
      // Tạo shipping record trong DB
      const shippingData = {
        ...body,
        invoice: invoice._id, // Ensure we store the invoice ID, not the whole object
        shipping_code: ghnResponse.data.order_code,
        shipping_fee: ghnResponse.data.total_fee,
        status: 'confirmed'
      };
      
      // Process expected delivery time
      if (ghnResponse.data.expected_delivery_time) {
        try {
          // Check if it's a timestamp (number) or a date string
          let deliveryDate;
          
          // HCM city districts are in range 1442-1480
          const isHCMCity = body.district_id >= 1442 && body.district_id <= 1480;
          
          if (isHCMCity) {
            // For HCM city: set delivery date to today + 5 hours
            deliveryDate = new Date();
            deliveryDate.setHours(deliveryDate.getHours() + 5);
            shippingData.expected_delivery_date = deliveryDate;
            console.log('HCM city order, setting delivery time to today + 5 hours:', deliveryDate);
          } else if (typeof ghnResponse.data.expected_delivery_time === 'number') {
            // Convert from Unix timestamp (seconds) to milliseconds
            deliveryDate = new Date(ghnResponse.data.expected_delivery_time * 1000);
            
            // Validate date
            if (!isNaN(deliveryDate.getTime())) {
              shippingData.expected_delivery_date = deliveryDate;
              console.log('Parsed delivery date from timestamp:', deliveryDate);
            } else {
              console.error('Invalid delivery date format from timestamp:', ghnResponse.data.expected_delivery_time);
              // Set a default delivery date (today + 2 days)
              deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 2);
              shippingData.expected_delivery_date = deliveryDate;
            }
          } else {
            // Try to parse as date string
            deliveryDate = new Date(ghnResponse.data.expected_delivery_time);
            
            // Validate date
            if (!isNaN(deliveryDate.getTime())) {
              shippingData.expected_delivery_date = deliveryDate;
              console.log('Parsed delivery date from string:', deliveryDate);
            } else {
              console.error('Invalid delivery date format from string:', ghnResponse.data.expected_delivery_time);
              // Set a default delivery date (today + 2 days)
              deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + 2);
              shippingData.expected_delivery_date = deliveryDate;
            }
          }
        } catch (dateErr) {
          console.error('Error parsing delivery date:', dateErr);
          // Set a default delivery date (today + 2 days)
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 2);
          shippingData.expected_delivery_date = defaultDate;
        }
      } else {
        // No expected delivery time provided, set a default (today + 2 days)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 2);
        shippingData.expected_delivery_date = defaultDate;
      }
      
      console.log('Dữ liệu shipping trước khi lưu:', JSON.stringify(shippingData));
      
      try {
        const shipping = await Shipping.create(shippingData);
        console.log('Shipping đã lưu thành công:', shipping._id);
        
        return {
          status: true,
          data: shipping,
          message: 'Đã tạo đơn vận chuyển thành công'
        };
      } catch (dbErr) {
        console.error('Lỗi khi lưu shipping vào DB:', dbErr);
        // Đơn đã tạo thành công trên GHN nhưng không lưu được vào DB
        return {
          status: true, // Vẫn trả về true vì đơn GHN đã tạo thành công
          ghn_data: {
            order_code: ghnResponse.data.order_code,
            expected_delivery_time: ghnResponse.data.expected_delivery_time,
            total_fee: ghnResponse.data.total_fee
          },
          message: 'Đã tạo đơn GHN thành công nhưng không lưu được vào hệ thống. Mã vận đơn: ' + ghnResponse.data.order_code
        };
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo shipping:', err);
      
      // Cải thiện thông báo lỗi từ GHN
      let errorMessage = 'Không thể tạo shipping';
      if (err.response?.data) {
        const ghnError = err.response.data;
        if (ghnError.message) {
          errorMessage = ghnError.message;
          // Thêm chi tiết nếu có code_message_value
          if (ghnError.code_message_value) {
            errorMessage += ` (${ghnError.code_message_value})`;
          }
        }
      }
      
      return {
        status: false,
        error: err.message,
        message: errorMessage
      };
    }
  }

  return {
    status: false,
    message: 'Method not allowed'
  };
}); 