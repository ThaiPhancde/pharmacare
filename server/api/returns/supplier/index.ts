// Tích hợp với MongoDB để xử lý supplier returns
import SupplierReturn from "../../../models/SupplierReturn";
import Stock from "../../../models/Stock";
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Get all supplier returns
  if (method === 'GET') {
    try {
      // Truy vấn từ MongoDB thay vì Prisma
      const returns = await SupplierReturn.find()
        .populate('items.medicine')
        .populate('supplier')
        .populate('purchase')
        .sort({ createdAt: -1 });

      return {
        status: true,
        data: returns,
        message: "Supplier returns retrieved successfully"
      };
    } catch (error: any) {
      console.error("Error fetching supplier returns:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error fetching supplier returns: ${error.message}`
      });
    }
  }

  // Create a new supplier return
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Tạo session MongoDB
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Tạo supplier return record
        const returnRecord = await SupplierReturn.create([{
          returnNumber: body.returnNumber,
          purchase: body.purchaseId,
          supplier: body.supplierId,
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
            // Giảm số lượng stock, đảm bảo không âm
            stock.unit_quantity = Math.max(0, stock.unit_quantity - item.quantity);
            
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
          message: "Supplier return created successfully"
        };
      } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    } catch (error: any) {
      console.error("Error creating supplier return:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error creating supplier return: ${error.message}`
      });
    }
  }
  
  // Phương thức không được hỗ trợ
  return {
    status: false,
    message: "Method not supported"
  };
}); 