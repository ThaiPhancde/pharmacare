import "@/server/models";
import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const method = event.method;
  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const populate = query.populate as string || '';

    // Xây dựng query dựa trên populate params
    let medicineQuery = Medicine.find().skip(skip).limit(limit);
    
    // Populate các trường chính
    medicineQuery = medicineQuery.populate("unit_id category_id type_id");

    // Populate stocks nếu được yêu cầu
    if (populate.includes('stocks')) {
      medicineQuery = medicineQuery.populate({
        path: 'stocks',
        model: 'Stock',
        match: { unit_quantity: { $gt: 0 } } // Chỉ lấy các stock có số lượng > 0
      });
    }

    const [data, total] = await Promise.all([
      medicineQuery,
      Medicine.countDocuments(),
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
    const session = await Medicine.startSession();
    session.startTransaction();

    try {
      // 1. Tạo medicine
      const createdMedicine = await Medicine.create([body], { session });

      // 2. Tạo stock liên kết với đầy đủ các trường
      // Sử dụng giá nhập và giá bán từ medicine nếu có
      await Stock.create(
        [
          {
            medicine: createdMedicine[0]._id,
            batch_id: createdMedicine[0].barcode || `BATCH-${Date.now()}`,
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // Mặc định 2 năm hạn sử dụng
            box_pattern: "",
            box_quantity: 0,
            unit_quantity: 0,
            purchase_price: createdMedicine[0].supplierPrice || 0,
            mrp: createdMedicine[0].price || 0,
            vat: 0 // Mặc định VAT là 0
          },
        ],
        { session }
      );

      // 3. Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { status: true, data: createdMedicine[0] };
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction failed:", err);
      return { status: false, error: err.message || "Transaction failed" };
    }
  }
});
