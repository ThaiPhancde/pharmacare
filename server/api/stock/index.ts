import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Stock.find().skip(skip).limit(limit),
      Stock.countDocuments(),
    ]);
    const dataFake = [
      {
        _id: "1",
        medicine: { name: "Hapacol 500mg" },
        batch_id: "8930001001",
        expiry_date: "2025-12-01",
        box_pattern: "10x10",
        box_quantity: 10,
        unit_quantity: 100,
        purchase_price: 10000,
        mrp: 15000,
        vat: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: "2",
        medicine: { name: "Medocillin 500mg" },
        batch_id: "8930001002",
        expiry_date: "2026-03-20",
        box_pattern: "5x10",
        box_quantity: 20,
        unit_quantity: 200,
        purchase_price: 12000,
        mrp: 18000,
        vat: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    return {
      data: dataFake,
      total: 2,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const created = await Stock.create(body);
    return { status: true, data: created };
  }
});
