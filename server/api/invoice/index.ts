import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import Medicine from "@/server/models/Medicine";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Invoice.find().populate('items.medicine').populate('customer').skip(skip).limit(limit),
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