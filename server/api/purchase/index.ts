import Purchase from "@/server/models/Purchase";
import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Purchase.find().populate('items.medicine').populate('supplier').skip(skip).limit(limit),
      Purchase.countDocuments(),
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
  
    const session = await Purchase.startSession();
    session.startTransaction();
  
    try {
      // 1. Tạo purchase
      const created = await Purchase.create([body], { session });
  
      // 2. Duyệt từng item để cập nhật hoặc tạo Stock
      for (const item of body.items) {
        const stock = await Stock.findOne({
          medicine: item.medicine,
          batch_id: item.batch_id,
        }).session(session);
  
        if (stock) {
          // Cập nhật số lượng và giá nếu cần
          stock.box_pattern = item.box_pattern;
          stock.box_quantity += item.box_quantity;
          stock.unit_quantity += item.unit_quantity;
          stock.purchase_price = item.supplier_price; // Cập nhật giá nhập mới nhất
          stock.mrp = item.mrp; // Cập nhật giá bán mới nhất
          stock.vat = item.vat; // Cập nhật VAT mới nhất
          await stock.save({ session });
        } else {
          // Tạo mới stock nếu chưa có
          await Stock.create([{
            medicine: item.medicine,
            batch_id: item.batch_id,
            expiry_date: item.expiry_date,
            box_pattern: item.box_pattern,
            box_quantity: item.box_quantity,
            unit_quantity: item.unit_quantity,
            purchase_price: item.supplier_price,
            mrp: item.mrp,
            vat: item.vat
          }], { session });
        }
      }
  
      await session.commitTransaction();
      session.endSession();
  
      return { status: true, data: created[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Purchase creation failed:', err);
      return { status: false, error: 'Transaction failed' };
    }
  }
});
