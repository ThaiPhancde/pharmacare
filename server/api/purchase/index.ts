import Purchase from "@/server/models/Purchase";
import Stock from "@/server/models/Stock";
import { Supplier } from "~/server/models";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Purchase.find()
        .populate("items.medicine")
        .populate("supplier")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Purchase.countDocuments(),
    ]);
    return {
      data,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === "POST") {
    const body = await readBody(event);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Tạo purchase
      // Convert date to Date object if it's a timestamp
      const purchaseData = { ...body };
      if (purchaseData.date && typeof purchaseData.date === 'number') {
        purchaseData.date = new Date(purchaseData.date);
      } else if (purchaseData.date && typeof purchaseData.date === 'string') {
        purchaseData.date = new Date(purchaseData.date);
      }
      
      // Convert expiry_date in items to Date objects
      if (purchaseData.items && Array.isArray(purchaseData.items)) {
        purchaseData.items = purchaseData.items.map(item => ({
          ...item,
          expiry_date: item.expiry_date 
            ? (typeof item.expiry_date === 'number' 
                ? new Date(item.expiry_date) 
                : typeof item.expiry_date === 'string' 
                  ? new Date(item.expiry_date) 
                  : item.expiry_date)
            : item.expiry_date
        }));
      }
      
      const created = await Purchase.create([purchaseData], { session });
      const purchaseId = created[0]._id;
      if (created[0].supplier) {
        // Cập nhật thông tin nhà cung cấp nếu có
        await Supplier.updateOne(
          { _id: created[0].supplier },
          { $inc: { balance: -body.total } },
          { session }
        );
      }

      // 2. Duyệt từng item để cập nhật hoặc tạo Stock
      for (const item of body.items) {
        // Convert expiry_date to Date if it's a timestamp
        let expiryDate = item.expiry_date;
        if (typeof expiryDate === 'number') {
          expiryDate = new Date(expiryDate);
        } else if (typeof expiryDate === 'string') {
          expiryDate = new Date(expiryDate);
        }
        
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
          expiry_date: expiryDate, // Thêm điều kiện tìm theo ngày hết hạn
        }).session(session);

        if (stock) {
          // Cập nhật số lượng và giá nếu cần
          stock.box_pattern = item.box_pattern;
          stock.box_quantity += item.box_quantity;
          stock.unit_quantity += item.unit_quantity;
          stock.purchase_price = item.supplier_price;
          stock.mrp = item.mrp;
          stock.vat = item.vat;
          await stock.save({ session });
        } else {
          // Tạo mới stock nếu chưa có
          // Convert expiry_date to Date if it's a timestamp
          let expiryDate = item.expiry_date;
          if (typeof expiryDate === 'number') {
            expiryDate = new Date(expiryDate);
          } else if (typeof expiryDate === 'string') {
            expiryDate = new Date(expiryDate);
          }
          
          await Stock.create(
            [
              {
                medicine: item.medicine,
                purchase: purchaseId, // Lưu liên kết đến Purchase
                batch_id: item.batch_id,
                expiry_date: expiryDate,
                box_pattern: item.box_pattern,
                box_quantity: item.box_quantity,
                unit_quantity: item.unit_quantity,
                purchase_price: item.supplier_price,
                mrp: item.mrp,
                vat: item.vat,
              },
            ],
            { session }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      return { status: true, data: created[0] };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Purchase creation failed:", err);
      return { 
        status: false, 
        error: err.message || "Transaction failed",
        message: err.message || "Transaction failed"
      };
    }
  }
});
