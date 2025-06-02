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
    
    // Đếm số lượng thuốc ĐÃ HẾT HẠN (thay vì hết hàng)
    const today = new Date();
    const expiredMedicinesCount = await Stock.countDocuments({
      expiry_date: { $lt: today },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    
    // Đếm số lượng thuốc sắp hết hạn trong vòng 30 ngày
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + 30);
    
    const expiringMedicinesCount = await Stock.countDocuments({
      expiry_date: { $gte: today, $lte: expiryDate },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    
    // Tính % thay đổi khách hàng
    const customerPercentChange = previousMonthCustomers > 0 
      ? ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100 
      : 0;
    
    // Lấy dữ liệu doanh số tháng hiện tại và tháng trước
    const [currentMonthSales, previousMonthSales] = await Promise.all([
      Invoice.find({ 
        date: { $gte: currentMonthStart }
      }),
      Invoice.find({ 
        date: { 
          $gte: previousMonthStart,
          $lt: currentMonthStart 
        }
      })
    ]);
    
    // Tính tổng doanh số
    const currentMonthTotalSales = currentMonthSales.reduce((sum, invoice) => sum + (invoice.grand_total || 0), 0);
    const previousMonthTotalSales = previousMonthSales.reduce((sum, invoice) => sum + (invoice.grand_total || 0), 0);
    
    // Tính % thay đổi doanh số
    const salesPercentChange = previousMonthTotalSales > 0 
      ? ((currentMonthTotalSales - previousMonthTotalSales) / previousMonthTotalSales) * 100 
      : 0;
    
    // Lấy 5 giao dịch gần nhất
    const recentSales = await Invoice.find()
      .populate('customer')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Format lại data recent sales
    const formattedRecentSales = recentSales.map(sale => ({
      _id: sale._id,
      customer_name: sale.customer?.full_name || 'Walk-in Customer',
      customer_email: sale.customer?.contact_info?.email || 'No email',
      amount: sale.grand_total || 0,
      date: sale.date,
      payment_method: sale.payment_method || 'cash'
    }));
    
    // Tính số thuốc hết hạn tuần trước để so sánh
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const lastWeekExpiredCount = await Stock.countDocuments({
      expiry_date: { $lt: lastWeek },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });
    
    const expiredMedicineChange = expiredMedicinesCount - lastWeekExpiredCount;
    
    return {
      status: true,
      data: {
        cardData: {
          totalCustomer: await Customer.countDocuments(),
          totalCustomerDesc: customerPercentChange,
          totalMedicine: totalMedicine,
          totalMedicineDesc: 0, // Không có dữ liệu so sánh
          sales: expiredMedicinesCount, // Hiển thị số thuốc đã hết hạn thay vì out of stock
          salesDesc: 0, // Thuốc đã hết hạn
          expiredMedicine: expiringMedicinesCount, // Số thuốc sắp hết hạn trong 30 ngày
          expiredMedicineDesc: expiredMedicineChange
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