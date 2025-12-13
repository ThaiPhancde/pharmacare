import Purchase from "@/server/models/Purchase";
import Stock from "@/server/models/Stock";
import { Supplier } from "~/server/models";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "GET") {
    try {
      const purchase = await Purchase.findById(id)
        .populate('supplier')
        .populate('items.medicine');
      
      if (!purchase) {
        return { 
          status: false, 
          message: "Purchase not found" 
        };
      }
      
      return { 
        status: true, 
        data: purchase,
        message: "Purchase details retrieved successfully" 
      };
    } catch (error) {
      console.error("Error fetching purchase details:", error);
      return { 
        status: false, 
        message: "Failed to fetch purchase details" 
      };
    }
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Lấy purchase cũ để so sánh
      const oldPurchase = await Purchase.findById(id).session(session);
      if (!oldPurchase) {
        await session.abortTransaction();
        session.endSession();
        return { status: false, message: "Purchase not found" };
      }

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

      // Cập nhật Purchase
      const updated = await Purchase.findByIdAndUpdate(id, purchaseData, { 
        new: true, 
        session 
      });

      // Cập nhật Supplier balance nếu có thay đổi
      if (oldPurchase.supplier && updated.supplier) {
        const oldTotal = oldPurchase.total || 0;
        const newTotal = updated.total || 0;
        const difference = newTotal - oldTotal;
        
        if (difference !== 0) {
          await Supplier.updateOne(
            { _id: updated.supplier },
            { $inc: { balance: -difference } },
            { session }
          );
        }
      }

      // Xử lý cập nhật Stock
      // Tạo map của items cũ theo medicine + batch_id
      const oldItemsMap = new Map();
      for (const item of oldPurchase.items || []) {
        const key = `${item.medicine}_${item.batch_id}`;
        oldItemsMap.set(key, item);
      }

      // Tạo map của items mới
      const newItemsMap = new Map();
      for (const item of body.items || []) {
        const key = `${item.medicine}_${item.batch_id}`;
        newItemsMap.set(key, item);
      }

      // Xử lý từng item mới
      for (const newItem of body.items || []) {
        const key = `${newItem.medicine}_${newItem.batch_id}`;
        const oldItem = oldItemsMap.get(key);

        // Convert expiry_date to Date
        let expiryDate = newItem.expiry_date;
        if (typeof expiryDate === 'number') {
          expiryDate = new Date(expiryDate);
        } else if (typeof expiryDate === 'string') {
          expiryDate = new Date(expiryDate);
        }

        const stock = await Stock.findOne({
          medicine: newItem.medicine,
          batch_id: newItem.batch_id,
          expiry_date: expiryDate,
        }).session(session);

        if (oldItem) {
          // Item đã tồn tại, cập nhật stock
          if (stock) {
            // Tính toán sự thay đổi số lượng
            const boxDiff = newItem.box_quantity - oldItem.box_quantity;
            const unitDiff = newItem.unit_quantity - oldItem.unit_quantity;

            // Cập nhật stock
            stock.box_pattern = newItem.box_pattern;
            stock.box_quantity += boxDiff;
            stock.unit_quantity += unitDiff;
            stock.purchase_price = newItem.supplier_price;
            stock.mrp = newItem.mrp;
            stock.vat = newItem.vat;
            await stock.save({ session });
          }
        } else {
          // Item mới, thêm vào stock
          if (stock) {
            // Stock đã tồn tại, cộng thêm số lượng
            stock.box_pattern = newItem.box_pattern;
            stock.box_quantity += newItem.box_quantity;
            stock.unit_quantity += newItem.unit_quantity;
            stock.purchase_price = newItem.supplier_price;
            stock.mrp = newItem.mrp;
            stock.vat = newItem.vat;
            await stock.save({ session });
          } else {
            // Tạo stock mới
            await Stock.create(
              [
                {
                  medicine: newItem.medicine,
                  purchase: id,
                  batch_id: newItem.batch_id,
                  expiry_date: expiryDate,
                  box_pattern: newItem.box_pattern,
                  box_quantity: newItem.box_quantity,
                  unit_quantity: newItem.unit_quantity,
                  purchase_price: newItem.supplier_price,
                  mrp: newItem.mrp,
                  vat: newItem.vat,
                },
              ],
              { session }
            );
          }
        }
      }

      // Xử lý items đã bị xóa (có trong old nhưng không có trong new)
      for (const oldItem of oldPurchase.items || []) {
        const key = `${oldItem.medicine}_${oldItem.batch_id}`;
        if (!newItemsMap.has(key)) {
          // Item đã bị xóa, trừ số lượng trong stock
          let expiryDate = oldItem.expiry_date;
          if (typeof expiryDate === 'number') {
            expiryDate = new Date(expiryDate);
          } else if (typeof expiryDate === 'string') {
            expiryDate = new Date(expiryDate);
          }

          const stock = await Stock.findOne({
            medicine: oldItem.medicine,
            batch_id: oldItem.batch_id,
            expiry_date: expiryDate,
          }).session(session);

          if (stock) {
            stock.box_quantity -= oldItem.box_quantity;
            stock.unit_quantity -= oldItem.unit_quantity;
            
            // Nếu số lượng = 0, có thể xóa stock hoặc giữ lại tùy logic
            if (stock.box_quantity <= 0 && stock.unit_quantity <= 0) {
              await Stock.deleteOne({ _id: stock._id }).session(session);
            } else {
              await stock.save({ session });
            }
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      return { status: true, data: updated };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Purchase update failed:", err);
      return { 
        status: false, 
        error: err.message || "Update failed",
        message: err.message || "Update failed"
      };
    }
  }

  if (method === "DELETE") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Lấy purchase trước khi xóa
      const purchase = await Purchase.findById(id).session(session);
      if (!purchase) {
        await session.abortTransaction();
        session.endSession();
        return { status: false, message: "Purchase not found" };
      }

      console.log("Deleting purchase:", {
        id: purchase._id,
        supplier: purchase.supplier,
        total: purchase.total,
        itemsCount: purchase.items?.length
      });

      // Xử lý Stock: trừ số lượng đã nhập
      for (const item of purchase.items || []) {
        // Convert expiry_date to Date
        let expiryDate = item.expiry_date;
        if (typeof expiryDate === 'number') {
          expiryDate = new Date(expiryDate);
        } else if (typeof expiryDate === 'string') {
          expiryDate = new Date(expiryDate);
        }

        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
          expiry_date: expiryDate,
        }).session(session);

        if (stock) {
          console.log("Updating stock:", {
            medicine: item.medicine,
            batch_id: item.batch_id,
            before: { box: stock.box_quantity, unit: stock.unit_quantity },
            removing: { box: item.box_quantity, unit: item.unit_quantity }
          });

          stock.box_quantity -= item.box_quantity;
          stock.unit_quantity -= item.unit_quantity;
          
          // Nếu số lượng <= 0, xóa stock
          if (stock.box_quantity <= 0 && stock.unit_quantity <= 0) {
            await Stock.deleteOne({ _id: stock._id }).session(session);
            console.log("Stock deleted (quantity = 0)");
          } else {
            await stock.save({ session });
            console.log("Stock updated:", { box: stock.box_quantity, unit: stock.unit_quantity });
          }
        } else {
          console.log("Stock not found for item:", {
            medicine: item.medicine,
            batch_id: item.batch_id
          });
        }
      }

      // Cập nhật Supplier balance nếu có - HOÀN TIỀN LẠI CHO SUPPLIER
      if (purchase.supplier) {
        const supplierUpdate = await Supplier.updateOne(
          { _id: purchase.supplier },
          { $inc: { balance: purchase.total || 0 } }, // Cộng lại số tiền đã trừ
          { session }
        );
        console.log("Supplier balance updated:", {
          supplierId: purchase.supplier,
          refundAmount: purchase.total,
          updated: supplierUpdate.modifiedCount
        });
      }

      // Xóa Purchase
      await Purchase.findByIdAndDelete(id).session(session);
      console.log("Purchase deleted successfully");

      await session.commitTransaction();
      session.endSession();

      return { status: true, message: "Purchase deleted successfully and refunded to supplier" };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Purchase deletion failed:", err);
      return { 
        status: false, 
        error: err.message || "Delete failed",
        message: err.message || "Failed to delete purchase: " + (err.message || "Unknown error")
      };
    }
  }
});