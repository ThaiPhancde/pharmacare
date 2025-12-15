import Invoice from "@/server/models/Invoice";
import Customer from "@/server/models/Customer";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 5;

    // Aggregate để tính tổng tiền mua của từng khách hàng
    const topCustomers = await Invoice.aggregate([
      {
        $match: {
          customer: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: "$customer",
          totalPurchases: { $sum: "$grand_total" },
          orderCount: { $sum: 1 },
          lastPurchase: { $max: "$date" }
        }
      },
      {
        $sort: { totalPurchases: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo"
        }
      },
      {
        $unwind: "$customerInfo"
      },
      {
        $project: {
          _id: 1,
          totalPurchases: 1,
          orderCount: 1,
          lastPurchase: 1,
          customerName: "$customerInfo.full_name",
          customerEmail: "$customerInfo.contact_info.email",
          customerPhone: "$customerInfo.contact_info.phone"
        }
      }
    ]);

    return {
      status: true,
      data: topCustomers,
      message: "Lấy danh sách top khách hàng thành công"
    };
  } catch (error) {
    console.error("Error fetching top customers:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu top khách hàng"
    };
  }
});
