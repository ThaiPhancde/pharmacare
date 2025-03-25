const Dashboard = require('../models/dashboard');
const Medicine = require('../models/medicine');
const Customer = require('../models/customer');

// Hiển thị trang Dashboard
exports.getDashboard = async (req, res) => {
  try {
    // Lấy thông tin tổng quan
    const summary = await Dashboard.getSummary();
    
    // Lấy thông tin thu chi
    const incomeExpense = await Dashboard.getIncomeExpense();
    
    // Lấy thông tin thuốc bán chạy
    const bestSellingMedicines = await Dashboard.getBestSellingMedicines();
    
    // Lấy thông tin tiến độ hàng tháng
    const monthlyProgress = await Dashboard.getMonthlyProgress();
    
    // Lấy báo cáo hôm nay
    const todayReport = await Dashboard.getTodayReport();
    
    res.render('dashboard', {
      title: 'Dashboard',
      summary,
      incomeExpense,
      bestSellingMedicines,
      monthlyProgress,
      todayReport,
      active: 'dashboard'
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu dashboard:', error);
    res.status(500).render('500', { 
      title: 'Lỗi máy chủ', 
      error: process.env.NODE_ENV === 'development' ? error : {} 
    });
  }
};