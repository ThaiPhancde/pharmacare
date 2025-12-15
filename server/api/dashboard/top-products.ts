import Invoice from "@/server/models/Invoice";
import Medicine from "@/server/models/Medicine";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit as string) || 5;

    // Aggregate để tính tổng số lượng bán của từng sản phẩm
    const topProducts = await Invoice.aggregate([
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: "$items.medicine",
          medicineName: { $first: "$items.medicine_name" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalQuantitySold: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicineInfo"
        }
      },
      {
        $project: {
          _id: 1,
          medicineName: {
            $cond: {
              if: { $gt: [{ $size: "$medicineInfo" }, 0] },
              then: { $arrayElemAt: ["$medicineInfo.medicine_name", 0] },
              else: "$medicineName"
            }
          },
          totalQuantitySold: 1,
          totalRevenue: 1,
          orderCount: 1,
          category: { $arrayElemAt: ["$medicineInfo.category", 0] }
        }
      }
    ]);

    return {
      status: true,
      data: topProducts,
      message: "Lấy danh sách top sản phẩm thành công"
    };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu top sản phẩm"
    };
  }
});
