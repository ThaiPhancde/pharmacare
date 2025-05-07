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
