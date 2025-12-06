// Tích hợp với MongoDB để xử lý returns
import CustomerReturn from "../../../models/CustomerReturn";
import Stock from "../../../models/Stock";
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Get all customer returns
  if (method === 'GET') {
    try {
      // Truy vấn từ MongoDB thay vì Prisma
      const returns = await CustomerReturn.find()
        .populate('items.medicine')
        .populate('customer')
        .populate('invoice')
        .sort({ createdAt: -1 });

      return {
        status: true,
        data: returns,
        message: "Customer returns retrieved successfully"
      };
    } catch (error: any) {
      console.error("Error fetching customer returns:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error fetching customer returns: ${error.message}`
      });
    }
  }

  // Create a new customer return
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Tạo session MongoDB
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Tạo customer return record
        const returnRecord = await CustomerReturn.create([{
          returnNumber: body.returnNumber,
          invoice: body.invoiceId,
          customer: body.customerId,
          returnDate: body.returnDate,
          totalAmount: body.totalAmount,
          reason: body.reason,
          status: body.status,
          items: body.items.map((item: any) => ({
            medicine: item.medicineId,
            medicineName: item.medicineName,
            batchId: item.batchId,
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          }))
        }], { session });

        // Cập nhật số lượng tồn kho
        for (const item of body.items) {
          // Tìm stock phù hợp
          const stock = await Stock.findOne({
            medicine: item.medicineId,
            batch_id: item.batchId
          }).session(session);

          if (stock) {
            // Tăng số lượng stock
            stock.unit_quantity += item.quantity;
            
            // Cập nhật số hộp nếu cần
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
        }

        await session.commitTransaction();
        session.endSession();
        
        return {
          status: true,
          data: returnRecord[0],
          message: "Customer return created successfully"
        };
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error: any) {
      console.error("Error creating customer return:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error creating customer return: ${error.message}`
      });
    }
  }
  
  // Phương thức không được hỗ trợ
  return {
    status: false,
    message: "Method not supported"
  };
}); 