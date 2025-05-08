import Purchase from "@/server/models/Purchase";
import Stock from "@/server/models/Stock";
import Medicine from "@/server/models/Medicine";
import Customer from "@/server/models/Customer";

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
    const medicines = await Medicine.find().limit(3); // Lấy 3 loại thuốc có sẵn
    const customers = await Customer.find().limit(3);

    if (medicines.length < 3) {
      console.error("❌ Cần ít nhất 3 loại thuốc trong collection `Medicine`.");
    }
  
    const purchases = [
      {
        supplier: customers[0].name,
        date: new Date("2025-05-01"),
        invoice_no: "INV-001",
        payment_type: "cash",
        items: [
          {
            medicine: medicines[0].name,
            batch_id: medicines[0].bar_code,
            expiry_date: new Date("2026-01-31"),
            box_pattern: "10x10",
            box_quantity: 10,
            unit_quantity: 100,
            supplier_price: 8000,
            mrp: 12000,
            vat: 5,
          },
          {
            medicine: medicines[1].name,
            batch_id: medicines[1].bar_code,
            expiry_date: new Date("2026-05-30"),
            box_pattern: "5x10",
            box_quantity: 5,
            unit_quantity: 50,
            supplier_price: 7000,
            mrp: 10000,
            vat: 10,
          },
        ],
      },
      {
        supplier: customers[1].name,
        date: new Date("2025-05-03"),
        invoice_no: "INV-002",
        payment_type: "bank",
        items: [
          {
            medicine: medicines[2].name,
            batch_id: medicines[2].bar_code,
            expiry_date: new Date("2025-12-15"),
            box_pattern: "2x10",
            box_quantity: 4,
            unit_quantity: 40,
            supplier_price: 5000,
            mrp: 8500,
            vat: 0,
          },
        ],
      },
      {
        supplier: customers[2].name,
        date: new Date("2025-05-05"),
        invoice_no: "INV-003",
        payment_type: "credit",
        items: [
          {
            medicine: medicines[0].name,
            batch_id: medicines[0].bar_code,
            expiry_date: new Date("2027-01-01"),
            box_pattern: "10x10",
            box_quantity: 12,
            unit_quantity: 120,
            supplier_price: 8500,
            mrp: 12500,
            vat: 5,
          },
          {
            medicine: medicines[1].name,
            batch_id: medicines[1].bar_code,
            expiry_date: new Date("2026-11-11"),
            box_pattern: "3x10",
            box_quantity: 3,
            unit_quantity: 30,
            supplier_price: 6000,
            mrp: 9500,
            vat: 8,
          },
        ],
      },
    ];

    return {
      data: purchases,
      total: 3,
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
          // Cập nhật số lượng
          stock.box_pattern = item.box_pattern
          stock.box_quantity += item.box_quantity;
          stock.unit_quantity += item.unit_quantity;
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
