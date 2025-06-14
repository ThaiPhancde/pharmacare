import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import Medicine from "@/server/models/Medicine";
import { SortOrder } from "mongoose";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Sort by updatedAt field in descending order (newest first)
    const sortOptions: { [key: string]: SortOrder } = { updatedAt: -1 };
    
    const [data, total] = await Promise.all([
      Invoice.find()
        .populate('items.medicine')
        .populate('customer')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(),
    ]);

    return {
      data,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === 'POST') {
    const body = await readBody(event);
  
    const session = await Invoice.startSession();
    session.startTransaction();
  
    try {
      // 1. Kiểm tra stock trước khi tạo invoice
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
        }).session(session);
  
        if (!stock) {
          throw new Error(`Stock not found for medicine: ${item.medicine} with batch: ${item.batch_id}`);
        }
  
        if (stock.unit_quantity < item.quantity) {
          throw new Error(`Insufficient stock for medicine: ${item.medicine}. Available: ${stock.unit_quantity}, Requested: ${item.quantity}`);
        }
      }
      
      // Handle cash payment with change calculation
      if (body.payment_method === 'cash' && body.paid > body.grand_total) {
        // Calculate change amount
        const change = body.paid - body.grand_total;
        
        // Store change amount in payment_details
        if (!body.payment_details) {
          body.payment_details = {};
        }
        body.payment_details.change = change;
        
        // For accounting purposes, we set paid to the actual amount received
        // and due to 0 since the customer has paid in full
        body.due = 0;
      } else if (body.payment_method === 'cash' && body.paid < body.grand_total) {
        // If paid less than total, calculate due amount
        body.due = body.grand_total - body.paid;
        body.payment_status = body.due > 0 ? 'partial' : 'paid';
      }
  
      // 2. Tạo invoice
      const created = await Invoice.create([body], { session });
  
      // 3. Cập nhật stock (giảm số lượng)
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
        }).session(session);
  
        // Cập nhật số lượng
        stock.unit_quantity -= item.quantity;
        
        // Cập nhật box_quantity nếu cần
        if (stock.box_pattern) {
          const boxMatch = stock.box_pattern.match(/(\d+)/);
          if (boxMatch) {
            const unitsPerBox = parseInt(boxMatch[0]);
            if (unitsPerBox > 0) {
              // Tính lại số lượng hộp từ số lượng lẻ còn lại
              stock.box_quantity = Math.floor(stock.unit_quantity / unitsPerBox);
            }
          }
        }
        
        await stock.save({ session });
      }
  
      await session.commitTransaction();
      session.endSession();
  
      return { status: true, data: created[0] };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('Invoice creation failed:', err);
      return { status: false, error: err.message || 'Transaction failed' };
    }
  }
}); 