import Invoice from "@/server/models/Invoice";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const year = parseInt(query.year as string) || new Date().getFullYear();
    const period = (query.period as string) || 'month'; // 'day', 'month', 'quarter', 'year'
    const month = parseInt(query.month as string) || new Date().getMonth() + 1;
    const quarter = parseInt(query.quarter as string) || Math.ceil((new Date().getMonth() + 1) / 3);
    
    let chartData: { name: string; total: number }[] = [];
    
    if (period === 'day') {
      // Lấy dữ liệu doanh thu theo ngày trong tháng
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      const endDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${daysInMonth}T23:59:59.999Z`);
      
      const dailyData = await Invoice.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: "$date" },
            total: { $sum: "$grand_total" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Tạo mảng dữ liệu cho tất cả ngày trong tháng
      chartData = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const dayData = dailyData.find(item => item._id === day);
        return {
          name: day.toString(),
          total: dayData ? dayData.total : 0
        };
      });
    } else if (period === 'quarter') {
      // Lấy dữ liệu doanh thu theo tháng trong quý
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      const startDate = new Date(`${year}-${startMonth.toString().padStart(2, '0')}-01`);
      const endDate = new Date(`${year}-${endMonth.toString().padStart(2, '0')}-${new Date(year, endMonth, 0).getDate()}T23:59:59.999Z`);
      
      const quarterData = await Invoice.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
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
      
      const monthNames = ['', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      
      chartData = Array.from({ length: 3 }, (_, index) => {
        const monthNum = startMonth + index;
        const monthData = quarterData.find(item => item._id === monthNum);
        return {
          name: monthNames[monthNum],
          total: monthData ? monthData.total : 0
        };
      });
    } else if (period === 'year') {
      // Lấy dữ liệu doanh thu theo quý trong năm
      const yearlyData = await Invoice.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $project: {
            quarter: {
              $ceil: { $divide: [{ $month: "$date" }, 3] }
            },
            grand_total: 1
          }
        },
        {
          $group: {
            _id: "$quarter",
            total: { $sum: "$grand_total" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      chartData = ['Q1', 'Q2', 'Q3', 'Q4'].map((name, index) => {
        const quarterData = yearlyData.find(item => item._id === index + 1);
        return {
          name,
          total: quarterData ? quarterData.total : 0
        };
      });
    } else {
      // Default: Lấy dữ liệu doanh thu theo tháng trong năm
      const monthlyData = await Invoice.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59.999Z`)
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
        'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 
        'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
      ];
      
      chartData = months.map((name, index) => {
        const monthData = monthlyData.find(item => item._id === index + 1);
        return {
          name,
          total: monthData ? monthData.total : 0
        };
      });
    }
    
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