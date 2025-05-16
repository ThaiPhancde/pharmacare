import Customer from "@/server/models/Customer";
import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";
import Invoice from "@/server/models/Invoice";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    // Lấy dữ liệu tháng hiện tại và tháng trước để so sánh
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const twoMonthsAgoStart = new Date(currentYear, currentMonth - 2, 1);
    
    // Đếm số lượng khách hàng
    const [currentMonthCustomers, previousMonthCustomers] = await Promise.all([
      Customer.countDocuments({ created_at: { $gte: currentMonthStart } }),
      Customer.countDocuments({ 
        created_at: { 
          $gte: previousMonthStart,
          $lt: currentMonthStart 
        } 
      })
    ]);
    
    // Đếm số lượng thuốc
    const totalMedicine = await Medicine.countDocuments();
    
    // Đếm số lượng thuốc hết hàng
    const outOfStock = await Stock.countDocuments({
      $or: [
        { box_quantity: 0, unit_quantity: 0 },
        { box_quantity: { $exists: false }, unit_quantity: { $exists: false } }
      ]
    });
    
    // Đếm số lượng thuốc sắp hết hạn trong vòng 30 ngày
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 30);
    
    const expiredMedicine = await Stock.countDocuments({
      expiry_date: { $gte: today, $lte: expiryDate },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    
    // Tính toán doanh thu (theo tháng hiện tại)
    const currentMonthSales = await Invoice.aggregate([
      { 
        $match: { 
          date: { $gte: currentMonthStart } 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$grand_total" }
        }
      }
    ]);
    
    const previousMonthSales = await Invoice.aggregate([
      { 
        $match: { 
          date: { 
            $gte: previousMonthStart, 
            $lt: currentMonthStart 
          } 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$grand_total" }
        }
      }
    ]);
    
    // Tính phần trăm tăng/giảm
    const currentMonthTotalSales = currentMonthSales.length > 0 ? currentMonthSales[0].total : 0;
    const previousMonthTotalSales = previousMonthSales.length > 0 ? previousMonthSales[0].total : 0;
    
    const salesPercentChange = previousMonthTotalSales === 0 
      ? 0 
      : (currentMonthTotalSales - previousMonthTotalSales) / previousMonthTotalSales;
    
    const customerPercentChange = previousMonthCustomers === 0 
      ? 0 
      : (currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers;
    
    // Lấy 5 hóa đơn gần nhất
    const recentSales = await Invoice.find()
      .populate({ path: 'customer', select: 'full_name contact_info' })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Format recent sales data
    const formattedRecentSales = recentSales.map(sale => ({
      name: sale.customer?.full_name || 'Khách vãng lai',
      email: sale.customer?.contact_info?.email || '',
      amount: sale.grand_total
    }));
    
    return {
      status: true,
      data: {
        cardData: {
          totalCustomer: await Customer.countDocuments(),
          totalCustomerDesc: customerPercentChange,
          totalMedicine: totalMedicine,
          totalMedicineDesc: 0, // Không có dữ liệu so sánh
          sales: currentMonthTotalSales,
          salesDesc: salesPercentChange,
          expiredMedicine: expiredMedicine,
          expiredMedicineDesc: 0 // Không có dữ liệu so sánh
        },
        recentSales: formattedRecentSales
      },
      message: "Lấy dữ liệu dashboard thành công"
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      status: false,
      error: "Không thể lấy dữ liệu dashboard"
    };
  }
}); 