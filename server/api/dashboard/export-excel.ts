import Customer from "@/server/models/Customer";
import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";
import Invoice from "@/server/models/Invoice";
import { SalaryReport, Employee } from '~/server/models';

interface ExcelData {
  // Dashboard Summary
  dashboardSummary: {
    totalCustomers: number;
    customerGrowth: number;
    totalMedicines: number;
    expiredMedicines: number;
    expiringMedicines: number;
    totalRevenue: number;
    revenueGrowth: number;
  };
  // Top Customers
  topCustomers: Array<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    totalPurchases: number;
    orderCount: number;
    lastPurchase: string;
  }>;
  // Top Products
  topProducts: Array<{
    medicineName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    orderCount: number;
    category?: string;
  }>;
  // Salary Statistics
  salaryStats: {
    summary: {
      totalEmployees: number;
      totalBasicSalary: number;
      totalOvertimePay: number;
      totalRewards: number;
      totalPenalties: number;
      totalNetSalary: number;
      avgNetSalary: number;
    };
    employees: Array<{
      employeeName: string;
      department: string;
      basicSalary: number;
      overtimePay: number;
      rewards: number;
      penalties: number;
      netSalary: number;
      status: string;
      paymentStatus: string;
    }>;
  };
  // Period Info
  periodInfo: {
    reportDate: string;
    month: number;
    year: number;
    dateFrom?: string;
    dateTo?: string;
  };
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const fromDate = query.from ? new Date(query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = query.to ? new Date(query.to as string) : new Date();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 1. Gather Dashboard Summary Data
    const dashboardSummary = await getDashboardSummary(fromDate, toDate);

    // 2. Gather Top Customers Data
    const topCustomers = await getTopCustomers(10);

    // 3. Gather Top Products Data
    const topProducts = await getTopProducts(10);

    // 4. Gather Salary Statistics
    const salaryStats = await getSalaryStatistics(currentMonth, currentYear);

    // Prepare full data object
    const excelData: ExcelData = {
      dashboardSummary,
      topCustomers,
      topProducts,
      salaryStats,
      periodInfo: {
        reportDate: new Date().toISOString(),
        month: currentMonth,
        year: currentYear,
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
      }
    };

    // Generate Excel content using simple CSV-style approach for reliability
    // We'll create a structured JSON that the client can convert to Excel
    const workbookData = generateWorkbookStructure(excelData);

    return {
      status: true,
      data: workbookData,
      message: "Export data generated successfully"
    };

  } catch (error: any) {
    console.error("Error generating export data:", error);
    return {
      status: false,
      error: error.message || "Unable to generate export data"
    };
  }
});

// Helper Functions

async function getDashboardSummary(fromDate: Date, toDate: Date) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);

  // Customer counts
  const [totalCustomers, currentMonthCustomers, previousMonthCustomers] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ created_at: { $gte: currentMonthStart } }),
    Customer.countDocuments({ 
      created_at: { $gte: previousMonthStart, $lt: currentMonthStart } 
    })
  ]);

  const customerGrowth = previousMonthCustomers > 0 
    ? ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100 
    : 0;

  // Medicine counts
  const totalMedicines = await Medicine.countDocuments();
  const today = new Date();
  
  const expiredMedicines = await Stock.countDocuments({
    expiry_date: { $lt: today },
    $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
  });

  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + 30);
  
  const expiringMedicines = await Stock.countDocuments({
    expiry_date: { $gte: today, $lte: expiryDate },
    $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
  });

  // Revenue calculation
  const [currentMonthInvoices, previousMonthInvoices] = await Promise.all([
    Invoice.find({ date: { $gte: currentMonthStart } }),
    Invoice.find({ date: { $gte: previousMonthStart, $lt: currentMonthStart } })
  ]);

  const currentRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const previousRevenue = previousMonthInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  
  const revenueGrowth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  return {
    totalCustomers,
    customerGrowth: Math.round(customerGrowth * 100) / 100,
    totalMedicines,
    expiredMedicines,
    expiringMedicines,
    totalRevenue: currentRevenue,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
  };
}

async function getTopCustomers(limit: number) {
  const topCustomers = await Invoice.aggregate([
    { $match: { customer: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$customer",
        totalPurchases: { $sum: "$grand_total" },
        orderCount: { $sum: 1 },
        lastPurchase: { $max: "$date" }
      }
    },
    { $sort: { totalPurchases: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerInfo"
      }
    },
    { $unwind: { path: "$customerInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        totalPurchases: 1,
        orderCount: 1,
        lastPurchase: 1,
        customerName: { $ifNull: ["$customerInfo.full_name", "Unknown Customer"] },
        customerEmail: { $ifNull: ["$customerInfo.contact_info.email", "N/A"] },
        customerPhone: { $ifNull: ["$customerInfo.contact_info.phone", "N/A"] }
      }
    }
  ]);

  return topCustomers.map(c => ({
    customerName: c.customerName,
    customerEmail: c.customerEmail,
    customerPhone: c.customerPhone,
    totalPurchases: c.totalPurchases,
    orderCount: c.orderCount,
    lastPurchase: c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('vi-VN') : 'N/A'
  }));
}

async function getTopProducts(limit: number) {
  const topProducts = await Invoice.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.medicine",
        medicineName: { $first: "$items.medicine_name" },
        totalQuantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.subtotal" },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalQuantitySold: -1 } },
    { $limit: limit },
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

  return topProducts.map(p => ({
    medicineName: p.medicineName || 'Unknown Product',
    totalQuantitySold: p.totalQuantitySold,
    totalRevenue: p.totalRevenue,
    orderCount: p.orderCount,
    category: p.category || 'Uncategorized'
  }));
}

async function getSalaryStatistics(month: number, year: number) {
  // Get summary statistics
  const summary = await SalaryReport.aggregate([
    { $match: { month, year } },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalBasicSalary: { $sum: '$basic_salary' },
        totalOvertimePay: { $sum: '$overtime_pay' },
        totalRewards: { $sum: '$total_rewards' },
        totalPenalties: { $sum: '$total_penalties' },
        totalNetSalary: { $sum: '$net_salary' },
        avgNetSalary: { $avg: '$net_salary' }
      }
    }
  ]);

  // Get individual employee salary data
  const employeeSalaries = await SalaryReport.find({ month, year })
    .populate('employee', 'full_name department designation')
    .sort({ net_salary: -1 });

  const employees = employeeSalaries.map(s => ({
    employeeName: (s.employee as any)?.full_name || 'Unknown',
    department: (s.employee as any)?.department || 'N/A',
    basicSalary: s.basic_salary || 0,
    overtimePay: s.overtime_pay || 0,
    rewards: s.total_rewards || 0,
    penalties: s.total_penalties || 0,
    netSalary: s.net_salary || 0,
    status: s.status || 'pending',
    paymentStatus: s.payment_status || 'unpaid'
  }));

  const summaryData = summary[0] || {
    totalEmployees: 0,
    totalBasicSalary: 0,
    totalOvertimePay: 0,
    totalRewards: 0,
    totalPenalties: 0,
    totalNetSalary: 0,
    avgNetSalary: 0
  };

  return {
    summary: summaryData,
    employees
  };
}

function generateWorkbookStructure(data: ExcelData) {
  return {
    // Sheet 1: Dashboard Summary
    dashboardSummary: {
      sheetName: "Dashboard Summary",
      headers: ["Metric", "Value", "Change (%)"],
      rows: [
        ["Total Customers", data.dashboardSummary.totalCustomers, data.dashboardSummary.customerGrowth],
        ["Total Medicines", data.dashboardSummary.totalMedicines, 0],
        ["Expired Medicines", data.dashboardSummary.expiredMedicines, 0],
        ["Expiring Medicines (30 days)", data.dashboardSummary.expiringMedicines, 0],
        ["Current Month Revenue", data.dashboardSummary.totalRevenue, data.dashboardSummary.revenueGrowth],
      ]
    },

    // Sheet 2: Top Customers
    topCustomers: {
      sheetName: "Top Customers",
      headers: ["Rank", "Customer Name", "Email", "Phone", "Total Purchases (VND)", "Order Count", "Last Purchase"],
      rows: data.topCustomers.map((c, idx) => [
        idx + 1,
        c.customerName,
        c.customerEmail,
        c.customerPhone,
        c.totalPurchases,
        c.orderCount,
        c.lastPurchase
      ])
    },

    // Sheet 3: Top Products
    topProducts: {
      sheetName: "Top Products",
      headers: ["Rank", "Product Name", "Category", "Quantity Sold", "Total Revenue (VND)", "Order Count"],
      rows: data.topProducts.map((p, idx) => [
        idx + 1,
        p.medicineName,
        p.category,
        p.totalQuantitySold,
        p.totalRevenue,
        p.orderCount
      ])
    },

    // Sheet 4: Salary Summary
    salarySummary: {
      sheetName: "Salary Summary",
      headers: ["Metric", "Value (VND)"],
      rows: [
        ["Total Employees", data.salaryStats.summary.totalEmployees],
        ["Total Basic Salary", data.salaryStats.summary.totalBasicSalary],
        ["Total Overtime Pay", data.salaryStats.summary.totalOvertimePay],
        ["Total Rewards", data.salaryStats.summary.totalRewards],
        ["Total Penalties", data.salaryStats.summary.totalPenalties],
        ["Total Net Salary", data.salaryStats.summary.totalNetSalary],
        ["Average Net Salary", Math.round(data.salaryStats.summary.avgNetSalary || 0)],
      ]
    },

    // Sheet 5: Employee Salaries
    employeeSalaries: {
      sheetName: "Employee Salaries",
      headers: ["Employee Name", "Department", "Basic Salary", "Overtime Pay", "Rewards", "Penalties", "Net Salary", "Status", "Payment Status"],
      rows: data.salaryStats.employees.map(e => [
        e.employeeName,
        e.department,
        e.basicSalary,
        e.overtimePay,
        e.rewards,
        e.penalties,
        e.netSalary,
        e.status,
        e.paymentStatus
      ])
    },

    // Meta Information
    reportInfo: {
      generatedAt: data.periodInfo.reportDate,
      month: data.periodInfo.month,
      year: data.periodInfo.year,
      dateRange: {
        from: data.periodInfo.dateFrom,
        to: data.periodInfo.dateTo
      }
    }
  };
}
