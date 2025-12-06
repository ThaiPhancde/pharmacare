import Invoice from "@/server/models/Invoice";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const year = parseInt(query.year as string) || new Date().getFullYear();
    
    // Lấy dữ liệu doanh thu theo tháng trong năm
    const monthlyData = await Invoice.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$grand_total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Tạo mảng dữ liệu cho 12 tháng
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const chartData = months.map((name, index) => {
      const monthData = monthlyData.find(item => item._id === index + 1);
      return {
        name,
        total: monthData ? monthData.total : 0
      };
    });
    
    return {
      status: true,
      data: chartData,
      message: "Lấy dữ liệu biểu đồ thành công"
    };
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu biểu đồ"
    };
  }
}); 