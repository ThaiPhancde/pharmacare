import { SalaryReport, Employee, RewardPenalty } from '~/server/models'
import { ShiftModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all salary reports with filters
    if (method === 'GET') {
      const query = getQuery(event)
      const { 
        employee, 
        month, 
        year, 
        status,
        payment_status,
        department,
        page, 
        limit 
      } = query

      const filter: any = {}
      
      if (employee) filter.employee = employee
      if (month) filter.month = parseInt(month as string)
      if (year) filter.year = parseInt(year as string)
      if (status) filter.status = status
      if (payment_status) filter.payment_status = payment_status

      // Department filter requires employee lookup
      let employeeFilter: any = {}
      if (department) {
        const deptEmployees = await Employee.find({ department }, '_id')
        const employeeIds = deptEmployees.map(e => e._id)
        filter.employee = { $in: employeeIds }
      }

      // Pagination
      const pageNum = page ? parseInt(page as string) : 1
      const limitNum = limit ? parseInt(limit as string) : 10
      const skip = (pageNum - 1) * limitNum

      // Get total count
      const total = await SalaryReport.countDocuments(filter)

      // Get paginated data with employee details
      const data = await SalaryReport.find(filter)
        .populate('employee', 'full_name email department designation employee_id salary_basic')
        .populate('approved_by', 'name email')
        .populate('created_by', 'name email')
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)

      return {
        status: true,
        data,
        total,
        page: pageNum,
        limit: limitNum,
        message: 'Salary reports loaded successfully',
      }
    }

    // POST - Generate salary report for a month
    if (method === 'POST') {
      const body = await readBody(event)
      const { month, year, employee_id, regenerate } = body

      if (!month || !year) {
        return { status: false, message: 'Month and year are required' }
      }

      const targetMonth = parseInt(month)
      const targetYear = parseInt(year)

      // If specific employee
      if (employee_id) {
        const result = await generateEmployeeSalaryReport(employee_id, targetMonth, targetYear, regenerate)
        return result
      }

      // Generate for all active employees
      const activeEmployees = await Employee.find({ status: 'active' })
      const results = []
      const errors = []

      for (const emp of activeEmployees) {
        try {
          const result = await generateEmployeeSalaryReport(emp._id.toString(), targetMonth, targetYear, regenerate)
          if (result.status) {
            results.push(result.data)
          } else {
            errors.push({ employee: emp.full_name, error: result.message })
          }
        } catch (err: any) {
          errors.push({ employee: emp.full_name, error: err.message })
        }
      }

      return {
        status: true,
        data: {
          generated: results.length,
          errors: errors.length,
          reports: results,
          errorDetails: errors
        },
        message: `Generated ${results.length} salary reports${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
      }
    }

    return { status: false, message: 'Method not allowed' }
  }
  catch (error: any) {
    console.error('SalaryReport API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})

// Helper function to generate salary report for single employee
async function generateEmployeeSalaryReport(
  employeeId: string, 
  month: number, 
  year: number, 
  regenerate: boolean = false
) {
  // Check if report already exists
  const existing = await SalaryReport.findOne({ 
    employee: employeeId, 
    month, 
    year 
  })

  if (existing && !regenerate) {
    return { 
      status: false, 
      message: 'Salary report already exists. Set regenerate=true to recreate.' 
    }
  }

  if (existing && existing.status === 'finalized') {
    return { 
      status: false, 
      message: 'Cannot regenerate a finalized salary report' 
    }
  }

  // Get employee details
  const employee = await Employee.findById(employeeId)
  if (!employee) {
    return { status: false, message: 'Employee not found' }
  }

  // Get approved rewards/penalties for the month
  const rewards = await RewardPenalty.find({
    employee: employeeId,
    month,
    year,
    type: 'reward',
    status: 'approved'
  })

  const penalties = await RewardPenalty.find({
    employee: employeeId,
    month,
    year,
    type: 'penalty',
    status: 'approved'
  })

  // Get shift data for working days calculation
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  const shifts = await ShiftModel.find({
    employee: employeeId,
    shift_date: { $gte: startDate, $lte: endDate },
    status: { $in: ['completed', 'active'] }
  })

  // Calculate working metrics
  const workingDays = getWorkingDaysInMonth(year, month)
  const presentDays = shifts.filter(s => s.status === 'completed').length
  const absentDays = workingDays - presentDays
  const overtimeHours = shifts.reduce((sum, s) => sum + (s.overtime_hours || 0), 0)

  // Calculate reward/penalty totals
  const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0)
  const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0)

  // Prepare reward/penalty details
  const rewardDetails = rewards.map(r => ({
    reward_id: r._id,
    title: r.title,
    category: r.category,
    amount: r.amount
  }))

  const penaltyDetails = penalties.map(p => ({
    penalty_id: p._id,
    title: p.title,
    category: p.category,
    amount: p.amount
  }))

  // Calculate insurance (Vietnam standard rates)
  const insuranceBase = Math.min(employee.salary_basic, 36000000) // Cap at 36M VND
  const socialInsurance = insuranceBase * 0.08 // 8%
  const healthInsurance = insuranceBase * 0.015 // 1.5%
  const unemploymentInsurance = insuranceBase * 0.01 // 1%

  // Calculate overtime pay
  const hourlyRate = employee.salary_basic / workingDays / 8
  const overtimePay = hourlyRate * overtimeHours * 1.5 // 1.5x rate

  // Create or update salary report
  const reportData = {
    employee: employeeId,
    month,
    year,
    basic_salary: employee.salary_basic,
    working_days: workingDays,
    present_days: presentDays,
    absent_days: absentDays,
    late_days: 0,
    leave_days: 0,
    overtime_hours: overtimeHours,
    overtime_rate: 1.5,
    overtime_pay: overtimePay,
    total_rewards: totalRewards,
    reward_details: rewardDetails,
    total_penalties: totalPenalties,
    penalty_details: penaltyDetails,
    allowances: [],
    total_allowances: 0,
    deductions: [],
    total_deductions: 0,
    social_insurance: socialInsurance,
    health_insurance: healthInsurance,
    unemployment_insurance: unemploymentInsurance,
    personal_income_tax: 0, // Will be calculated based on taxable income
    status: 'calculated',
    calculated_at: new Date()
  }

  let report
  if (existing) {
    report = await SalaryReport.findByIdAndUpdate(
      existing._id,
      reportData,
      { new: true, runValidators: true }
    )
  } else {
    report = new SalaryReport(reportData)
    await report.save()
  }

  // Mark rewards/penalties as applied
  await RewardPenalty.updateMany(
    { _id: { $in: [...rewards.map(r => r._id), ...penalties.map(p => p._id)] } },
    { status: 'applied' }
  )

  await report.populate('employee', 'full_name email department')

  return {
    status: true,
    data: report,
    message: 'Salary report generated successfully'
  }
}

// Helper to calculate working days in a month (excluding weekends)
function getWorkingDaysInMonth(year: number, month: number): number {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  let workingDays = 0

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workingDays++
    }
  }

  return workingDays
}
