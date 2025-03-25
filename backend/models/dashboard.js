const db = require('../config/db');

class Dashboard {
  static async getSummary() {
    try {
      // Tổng số khách hàng
      const [customerRows] = await db.execute('SELECT COUNT(*) as count FROM customers');
      const totalCustomers = customerRows[0].count;

      // Tổng số thuốc
      const [medicineRows] = await db.execute('SELECT COUNT(*) as count FROM medicines');
      const totalMedicines = medicineRows[0].count;

      // Thuốc hết hàng
      const [outOfStockRows] = await db.execute('SELECT COUNT(*) as count FROM medicines WHERE stock_quantity <= 0');
      const outOfStock = outOfStockRows[0].count;

      // Thuốc hết hạn
      const today = new Date().toISOString().split('T')[0];
      const [expiredRows] = await db.execute(
        'SELECT COUNT(*) as count FROM medicines WHERE expiry_date < ? AND stock_quantity > 0',
        [today]
      );
      const expired = expiredRows[0].count;

      return {
        totalCustomers,
        totalMedicines,
        outOfStock,
        expired
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  }

  static async getIncomeExpense() {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Tổng doanh thu tháng này
      const [incomeRows] = await db.execute(`
        SELECT SUM(total_amount) as amount
        FROM invoices
        WHERE YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?
      `, [currentYear, currentMonth]);
      const income = incomeRows[0].amount || 0;

      // Tổng chi phí tháng này
      const [expenseRows] = await db.execute(`
        SELECT SUM(total_amount) as amount
        FROM purchases
        WHERE YEAR(purchase_date) = ? AND MONTH(purchase_date) = ?
      `, [currentYear, currentMonth]);
      const expense = expenseRows[0].amount || 0;

      // Lợi nhuận
      const profit = income - expense;

      return {
        income,
        expense,
        profit
      };
    } catch (error) {
      console.error('Error getting income expense data:', error);
      throw error;
    }
  }

  static async getBestSellingMedicines(limit = 7) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const [rows] = await db.execute(`
        SELECT m.name, SUM(id.quantity) as total_sold
        FROM invoices i
        JOIN invoice_details id ON i.id = id.invoice_id
        JOIN medicines m ON id.medicine_id = m.id
        WHERE YEAR(i.invoice_date) = ? AND MONTH(i.invoice_date) = ?
        GROUP BY m.id, m.name
        ORDER BY total_sold DESC
        LIMIT ?
      `, [currentYear, currentMonth, limit]);

      return rows;
    } catch (error) {
      console.error('Error getting best selling medicines:', error);
      throw error;
    }
  }

  static async getMonthlyProgress() {
    try {
      const currentYear = new Date().getFullYear();
      
      // Doanh thu hàng tháng trong năm hiện tại
      const [salesRows] = await db.execute(`
        SELECT MONTH(invoice_date) as month, SUM(total_amount) as amount
        FROM invoices
        WHERE YEAR(invoice_date) = ?
        GROUP BY MONTH(invoice_date)
        ORDER BY MONTH(invoice_date)
      `, [currentYear]);
      
      // Chuyển đổi thành mảng 12 tháng
      const monthlySales = Array(12).fill(0);
      salesRows.forEach(row => {
        monthlySales[row.month - 1] = parseFloat(row.amount);
      });

      // Chi phí hàng tháng trong năm hiện tại
      const [expenseRows] = await db.execute(`
        SELECT MONTH(purchase_date) as month, SUM(total_amount) as amount
        FROM purchases
        WHERE YEAR(purchase_date) = ?
        GROUP BY MONTH(purchase_date)
        ORDER BY MONTH(purchase_date)
      `, [currentYear]);
      
      // Chuyển đổi thành mảng 12 tháng
      const monthlyExpenses = Array(12).fill(0);
      expenseRows.forEach(row => {
        monthlyExpenses[row.month - 1] = parseFloat(row.amount);
      });

      // Lợi nhuận hàng tháng
      const monthlyProfit = monthlySales.map((sale, index) => sale - monthlyExpenses[index]);

      return {
        monthlySales,
        monthlyExpenses,
        monthlyProfit
      };
    } catch (error) {
      console.error('Error getting monthly progress:', error);
      throw error;
    }
  }

  static async getTodayReport() {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Tổng doanh thu hôm nay
      const [salesRows] = await db.execute(`
        SELECT SUM(total_amount) as amount
        FROM invoices
        WHERE DATE(invoice_date) = ?
      `, [today]);
      const totalSales = salesRows[0].amount || 0;

      // Tổng chi phí hôm nay
      const [purchaseRows] = await db.execute(`
        SELECT SUM(total_amount) as amount
        FROM purchases
        WHERE DATE(purchase_date) = ?
      `, [today]);
      const totalPurchase = purchaseRows[0].amount || 0;

      // Số hóa đơn hôm nay
      const [invoiceRows] = await db.execute(`
        SELECT COUNT(*) as count
        FROM invoices
        WHERE DATE(invoice_date) = ?
      `, [today]);
      const totalInvoices = invoiceRows[0].count;

      // Thuốc bán chạy nhất hôm nay
      const [topMedicineRows] = await db.execute(`
        SELECT m.name, SUM(id.quantity) as quantity
        FROM invoices i
        JOIN invoice_details id ON i.id = id.invoice_id
        JOIN medicines m ON id.medicine_id = m.id
        WHERE DATE(i.invoice_date) = ?
        GROUP BY m.id, m.name
        ORDER BY quantity DESC
        LIMIT 1
      `, [today]);
      const topMedicine = topMedicineRows.length > 0 ? topMedicineRows[0] : { name: 'N/A', quantity: 0 };

      return {
        totalSales,
        totalPurchase,
        totalInvoices,
        topMedicine
      };
    } catch (error) {
      console.error('Error getting today report:', error);
      throw error;
    }
  }
}

module.exports = Dashboard; 