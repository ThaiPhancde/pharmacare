import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // Chỉ hỗ trợ POST cho POS Invoice
  if (method === 'POST') {
    const body = await readBody(event);
  
    // Đảm bảo đánh dấu đây là POS invoice
    body.is_pos = true;
    
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      console.log('Creating POS invoice with payment method:', body.payment_method);
      
      // Tạo danh sách stocks để lưu dữ liệu tạm thời
      const stockItems = [];
      
      // 1. Kiểm tra stock trước khi tạo invoice
      for (const item of body.items) {
        // Tìm stock theo stock_id nếu có, nếu không thì tìm theo medicine và batch_id
        let stock;
        if (item.stock_id) {
          stock = await Stock.findById(item.stock_id).session(session);
        } else {
          stock = await Stock.findOne({
            medicine: item.medicine,
            batch_id: item.batch_id,
          }).session(session);
        }
  
        if (!stock) {
          throw new Error(`Stock not found for medicine: ${item.medicine} with batch: ${item.batch_id}`);
        }
  
        if (stock.unit_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine: ${item.medicine}. Available: ${stock.unit_quantity}, Requested: ${item.quantity}`);
        }
        
        // Lưu lại stock để sử dụng sau
        stockItems.push({ stock, quantity: item.quantity });
      }
      
      // Xóa các trường không cần thiết trước khi lưu invoice
      body.items.forEach((item: any) => {
        delete item.stock_id;
        delete item.days_left;
        delete item.original_price;
        delete item.discount_percentage;
        delete item.discount_reason;
        delete item.purchase;
        // Các trường khác có thể cần xóa
      });
  
      // 2. Tạo invoice 
      // Đảm bảo có _id cho tất cả các phương thức thanh toán
      if (!body._id) {
        body._id = `INV-CUS-${Date.now()}`;
        console.log('Generated invoice ID:', body._id);
      }
      
      // Đảm bảo payment_status được đặt đúng
      if (!body.payment_status) {
        body.payment_status = 'paid';
      }
      
      console.log('Creating invoice with data:', JSON.stringify(body, null, 2));
      const created = await Invoice.create([body], { session });
      console.log('Invoice created with ID:', created[0]._id);
  
      // 3. Cập nhật stock (giảm số lượng)
      for (const stockItem of stockItems) {
        const stock = stockItem.stock;
        const quantity = stockItem.quantity;
        
        // Cập nhật số lượng
        stock.unit_quantity -= quantity;
        
        // Cập nhật box_quantity nếu cần
        if (stock.box_pattern) {
          const boxMatch = stock.box_pattern.match(/(\d+)/);
          if (boxMatch) {
            const unitsPerBox = parseInt(boxMatch[0]);
            if (unitsPerBox > 0) {
              stock.box_quantity = Math.floor(stock.unit_quantity / unitsPerBox);
            }
          }
        }
        
        await stock.save({ session });
      }
  
      await session.commitTransaction();
      session.endSession();
  
      return { 
        status: true, 
        data: created[0],
        message: "POS Invoice created successfully" 
      };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('POS Invoice creation failed:', err);
      return { 
        status: false, 
        error: err.message || 'Transaction failed',
        message: "Failed to create POS Invoice" 
      };
    }
  } else {
    return {
      status: false,
      message: "Method not allowed. Only POST is supported for POS Invoice."
    };
  }
}); 