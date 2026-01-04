import Customer from "@/server/models/Customer";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const year = parseInt(query.year as string) || new Date().getFullYear();
    const period = (query.period as string) || 'quarter'; // 'month' or 'quarter'
    
    let chartData: { name: string; total: number }[] = [];
    
    if (period === 'month') {
      // Lấy dữ liệu tăng trưởng khách hàng theo tháng
      const monthlyData = await Customer.aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $group: {
            _id: { $month: "$created_at" },
            total: { $sum: 1 }
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
    } else {
      // Lấy dữ liệu tăng trưởng khách hàng theo quý
      const quarterlyData = await Customer.aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $project: {
            quarter: {
              $ceil: { $divide: [{ $month: "$created_at" }, 3] }
            }
          }
        },
        {
          $group: {
            _id: "$quarter",
            total: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      // Tạo mảng dữ liệu cho 4 quý với format giống ảnh
      const quarters = [`${(year % 100) - 1 < 10 ? '0' : ''}${year % 100 - 1 < 0 ? year % 100 : year % 100 - 1}`, `1-${year}`, `2-${year}`, `3-${year}`, `4-${year}`];
      
      // Lấy dữ liệu quý cuối năm trước
      const previousYearQ4 = await Customer.aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(`${year - 1}-10-01`),
              $lte: new Date(`${year - 1}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $count: "total"
        }
      ]);
      
      chartData = [
        { name: `Q4-${year - 1}`, total: previousYearQ4[0]?.total || 0 },
        ...['Q1', 'Q2', 'Q3', 'Q4'].map((name, index) => {
          const quarterData = quarterlyData.find(item => item._id === index + 1);
          return {
            name: `${name}-${year}`,
            total: quarterData ? quarterData.total : 0
          };
        })
      ];
    }
    
    // Tính summary
    const totalUsers = await Customer.countDocuments();
    
    // Tính số khách hàng tạo mới trong kỳ hiện tại
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;
    
    if (period === 'month') {
      currentPeriodStart = new Date(year, currentMonth, 1);
      previousPeriodStart = new Date(year, currentMonth - 1, 1);
      previousPeriodEnd = new Date(year, currentMonth, 0);
    } else {
      currentPeriodStart = new Date(year, (currentQuarter - 1) * 3, 1);
      previousPeriodStart = new Date(year, (currentQuarter - 2) * 3, 1);
      previousPeriodEnd = new Date(year, (currentQuarter - 1) * 3, 0);
    }
    
    const [currentPeriodCount, previousPeriodCount] = await Promise.all([
      Customer.countDocuments({
        created_at: { $gte: currentPeriodStart }
      }),
      Customer.countDocuments({
        created_at: { 
          $gte: previousPeriodStart,
          $lte: previousPeriodEnd
        }
      })
    ]);
    
    // Tính tỷ lệ tăng trưởng
    const growthRate = previousPeriodCount > 0 
      ? ((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100 
      : (currentPeriodCount > 0 ? 100 : 0);
    
    return {
      status: true,
      data: chartData,
      summary: {
        totalUsers,
        currentPeriodGrowth: currentPeriodCount,
        previousPeriodGrowth: previousPeriodCount,
        growthRate
      },
      message: "Lấy dữ liệu tăng trưởng khách hàng thành công"
    };
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu tăng trưởng khách hàng"
    };
  }
});
