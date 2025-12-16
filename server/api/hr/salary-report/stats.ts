import { SalaryReport, Employee } from '~/server/models'

// Get salary statistics
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { month, year, department } = query

    const currentDate = new Date()
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear()

    // Build match filter
    const matchFilter: any = {
      month: targetMonth,
      year: targetYear
    }

    // Department filter
    if (department) {
      const deptEmployees = await Employee.find({ department }, '_id')
      const employeeIds = deptEmployees.map(e => e._id)
      matchFilter.employee = { $in: employeeIds }
    }

    // Get summary statistics
    const summary = await SalaryReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalBasicSalary: { $sum: '$basic_salary' },
          totalOvertimePay: { $sum: '$overtime_pay' },
          totalRewards: { $sum: '$total_rewards' },
          totalPenalties: { $sum: '$total_penalties' },
          totalAllowances: { $sum: '$total_allowances' },
          totalDeductions: { $sum: '$total_deductions' },
          totalSocialInsurance: { $sum: '$social_insurance' },
          totalHealthInsurance: { $sum: '$health_insurance' },
          totalUnemploymentInsurance: { $sum: '$unemployment_insurance' },
          totalTax: { $sum: '$personal_income_tax' },
          totalGrossSalary: { $sum: '$gross_salary' },
          totalNetSalary: { $sum: '$net_salary' },
          avgNetSalary: { $avg: '$net_salary' },
          maxNetSalary: { $max: '$net_salary' },
          minNetSalary: { $min: '$net_salary' }
        }
      }
    ])

    // Status breakdown
    const statusBreakdown = await SalaryReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$net_salary' }
        }
      }
    ])

    // Payment status breakdown
    const paymentBreakdown = await SalaryReport.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$net_salary' }
        }
      }
    ])

    // Department breakdown
    const departmentBreakdown = await SalaryReport.aggregate([
      { $match: { month: targetMonth, year: targetYear } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'emp'
        }
      },
      { $unwind: '$emp' },
      {
        $group: {
          _id: '$emp.department',
          employeeCount: { $sum: 1 },
          totalBasicSalary: { $sum: '$basic_salary' },
          totalNetSalary: { $sum: '$net_salary' },
          totalRewards: { $sum: '$total_rewards' },
          totalPenalties: { $sum: '$total_penalties' },
          avgNetSalary: { $avg: '$net_salary' }
        }
      },
      { $sort: { totalNetSalary: -1 } }
    ])

    // Top earners
    const topEarners = await SalaryReport.find(matchFilter)
      .populate('employee', 'full_name department designation')
      .sort({ net_salary: -1 })
      .limit(10)
      .select('employee net_salary gross_salary total_rewards total_penalties')

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date(targetYear, targetMonth - 7, 1)
    const monthlyTrend = await SalaryReport.aggregate([
      {
        $match: {
          $expr: {
            $gte: [
              { $dateFromParts: { year: '$year', month: '$month' } },
              sixMonthsAgo
            ]
          }
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalNetSalary: { $sum: '$net_salary' },
          totalGrossSalary: { $sum: '$gross_salary' },
          employeeCount: { $sum: 1 },
          totalRewards: { $sum: '$total_rewards' },
          totalPenalties: { $sum: '$total_penalties' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    const summaryData = summary[0] || {
      totalEmployees: 0,
      totalBasicSalary: 0,
      totalOvertimePay: 0,
      totalRewards: 0,
      totalPenalties: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalSocialInsurance: 0,
      totalHealthInsurance: 0,
      totalUnemploymentInsurance: 0,
      totalTax: 0,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      avgNetSalary: 0,
      maxNetSalary: 0,
      minNetSalary: 0
    }

    return {
      status: true,
      data: {
        month: targetMonth,
        year: targetYear,
        summary: {
          ...summaryData,
          totalInsurance: summaryData.totalSocialInsurance + 
                         summaryData.totalHealthInsurance + 
                         summaryData.totalUnemploymentInsurance
        },
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = { count: item.count, totalAmount: item.totalAmount }
          return acc
        }, {} as Record<string, any>),
        paymentBreakdown: paymentBreakdown.reduce((acc, item) => {
          acc[item._id] = { count: item.count, totalAmount: item.totalAmount }
          return acc
        }, {} as Record<string, any>),
        departmentBreakdown,
        topEarners: topEarners.map(t => ({
          employee: t.employee,
          net_salary: t.net_salary,
          gross_salary: t.gross_salary,
          total_rewards: t.total_rewards,
          total_penalties: t.total_penalties
        })),
        monthlyTrend: monthlyTrend.map(m => ({
          month: m._id.month,
          year: m._id.year,
          totalNetSalary: m.totalNetSalary,
          totalGrossSalary: m.totalGrossSalary,
          employeeCount: m.employeeCount,
          totalRewards: m.totalRewards,
          totalPenalties: m.totalPenalties
        }))
      },
      message: 'Salary statistics loaded successfully'
    }
  }
  catch (error: any) {
    console.error('SalaryReport Stats API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
