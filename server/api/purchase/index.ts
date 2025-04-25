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
      Purchase.find().populate('items.medicine').skip(skip).limit(limit),
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

    // 1. Tạo purchase trước
    const created = await Purchase.create(body);

    // 2. Loop qua items để tạo Stock
    const stockList = body.items.map((item) => ({
      medicine: item.medicine,
      batch_id: item.batch_id,
      expiry_date: item.expiry_date,
      box_pattern: item.box_pattern,
      box_qty: item.box_qty,
      unit_qty: item.unit_qty,
      purchase_price: item.purchase_price,
      mrp: item.mrp,
      vat: item.vat,
      purchase_id: created._id,
    }));

    // 3. Tạo hết stock một lần
    await Stock.insertMany(stockList);

    return { status: true, data: created };
  }
});
