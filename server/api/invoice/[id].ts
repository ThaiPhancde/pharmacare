import Invoice from "@/server/models/Invoice";
import Stock from "@/server/models/Stock";
import mongoose from 'mongoose';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const { id: rawId } = event.context.params || {};

  if (!rawId) {
    return {
      status: false,
      message: "Invoice ID is required",
    };
  }

  // Normalize the ID - replace spaces with dashes and convert to uppercase
  const id = decodeURIComponent(rawId).replace(/\s+/g, '-').toUpperCase();
  console.log(`Processing normalized invoice ID: ${id} (original: ${rawId})`);

  if (method === "GET") {
    try {
      const invoice = await Invoice.findOne({ _id: id })
        .populate("items.medicine")
        .populate("customer");

      if (!invoice) {
        console.log(`Invoice not found with ID: ${id}`);
        return {
          status: false,
          message: "Invoice not found",
        };
      }

      return {
        status: true,
        data: invoice,
        message: "Invoice details retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return {
        status: false,
        message: "Failed to fetch invoice details",
      };
    }
  }

  if (method === "DELETE") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the invoice
      const invoice = await Invoice.findOne({ _id: id }).session(session);
      
      if (!invoice) {
        await session.abortTransaction();
        session.endSession();
        return {
          status: false,
          message: "Invoice not found",
        };
      }

      // 2. Return stock quantities (reverse stock update)
      for (const item of invoice.items) {
        // Find stock for this medicine and batch
        let stock;
        
        if (item.stock_id) {
          stock = await Stock.findById(item.stock_id).session(session);
        } else {
          stock = await Stock.findOne({
            medicine: item.medicine,
            batch_id: item.batch_id
          }).session(session);
        }

        if (stock) {
          // Increase stock quantity (reverse the deduction)
          stock.unit_quantity += item.quantity;
          
          // Update box quantity if needed
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

      // 3. Delete the invoice
      await Invoice.deleteOne({ _id: id }).session(session);

      await session.commitTransaction();
      session.endSession();

      return {
        status: true,
        message: "Invoice deleted successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error deleting invoice:", error);
      return {
        status: false,
        message: "Failed to delete invoice",
      };
    }
  }

  return {
    status: false,
    message: "Method not allowed",
  };
}); 