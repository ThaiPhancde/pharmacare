import Stock from "@/server/models/Stock";
import Purchase from "@/server/models/Purchase";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Find all stocks and populate medicine and purchase information
    // But don't apply pagination yet
    const stocks = await Stock.find()
      .populate("medicine", "name bar_code")
      .populate({
        path: "purchase",
        populate: {
          path: "supplier",
          select: "name"
        }
      })
      .sort({ createdAt: -1 }); // Sort by creation date descending (newest first)

    // Group stocks by medicine name and batch_id
    const groupedData = [];
    const groupedMap = new Map();

    for (const stock of stocks) {
      if (!stock.medicine) continue;
      
      const key = `${stock.medicine._id}-${stock.batch_id}`;
      
      if (!groupedMap.has(key)) {
        // Create a new group entry
        groupedMap.set(key, {
          medicine: stock.medicine,
          batch_id: stock.batch_id,
          variants: [],
          total_unit_quantity: 0
        });
        groupedData.push(groupedMap.get(key));
      }
      
      // Add the stock variant to the group
      const group = groupedMap.get(key);
      group.variants.push({
        _id: stock._id,
        expiry_date: stock.expiry_date,
        box_pattern: stock.box_pattern,
        box_quantity: stock.box_quantity,
        unit_quantity: stock.unit_quantity,
        purchase_price: stock.purchase_price,
        mrp: stock.mrp,
        vat: stock.vat,
        supplier: stock.purchase?.supplier?.name || "Unknown",
        purchase_id: stock.purchase?._id,
        createdAt: stock.createdAt
      });
      
      // Update total quantity
      group.total_unit_quantity += stock.unit_quantity || 0;
    }

    // Get total count of grouped items
    const totalGroups = groupedData.length;
    
    // Apply pagination to grouped data
    const paginatedData = groupedData.slice(skip, skip + limit);

    return {
      data: paginatedData,
      total: totalGroups,
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
