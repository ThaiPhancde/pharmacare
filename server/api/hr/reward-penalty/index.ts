import { RewardPenalty, Employee } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all rewards/penalties with filters
    if (method === 'GET') {
      const query = getQuery(event)
      const { 
        employee, 
        type, 
        category, 
        status, 
        month, 
        year, 
        search,
        page, 
        limit,
        startDate,
        endDate
      } = query

      const filter: any = {}
      
      if (employee) filter.employee = employee
      if (type) filter.type = type
      if (category) filter.category = category
      if (status) filter.status = status
      if (month) filter.month = parseInt(month as string)
      if (year) filter.year = parseInt(year as string)
      
      if (startDate || endDate) {
        filter.effective_date = {}
        if (startDate) filter.effective_date.$gte = new Date(startDate as string)
        if (endDate) filter.effective_date.$lte = new Date(endDate as string)
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      // Pagination
      const pageNum = page ? parseInt(page as string) : 1
      const limitNum = limit ? parseInt(limit as string) : 10
      const skip = (pageNum - 1) * limitNum

      // Get total count
      const total = await RewardPenalty.countDocuments(filter)

      // Get paginated data with employee details
      const data = await RewardPenalty.find(filter)
        .populate('employee', 'full_name email department designation employee_id')
        .populate('approved_by', 'name email')
        .populate('created_by', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)

      return {
        status: true,
        data,
        total,
        page: pageNum,
        limit: limitNum,
        message: 'Reward/Penalty list loaded successfully',
      }
    }

    // POST - Create new reward/penalty
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Validate required fields
      if (!body.employee) {
        return { status: false, message: 'Employee is required' }
      }
      if (!body.type || !['reward', 'penalty'].includes(body.type)) {
        return { status: false, message: 'Valid type (reward/penalty) is required' }
      }
      if (!body.category) {
        return { status: false, message: 'Category is required' }
      }
      if (!body.title) {
        return { status: false, message: 'Title is required' }
      }
      if (body.amount === undefined || body.amount < 0) {
        return { status: false, message: 'Valid amount is required' }
      }
      if (!body.effective_date) {
        return { status: false, message: 'Effective date is required' }
      }

      // Check if employee exists
      const employeeExists = await Employee.findById(body.employee)
      if (!employeeExists) {
        return { status: false, message: 'Employee not found' }
      }

      // Parse effective date and set month/year
      const effectiveDate = new Date(body.effective_date)
      body.month = body.month || (effectiveDate.getMonth() + 1)
      body.year = body.year || effectiveDate.getFullYear()

      const newRecord = new RewardPenalty(body)
      await newRecord.save()

      // Populate employee data for response
      await newRecord.populate('employee', 'full_name email department')

      return {
        status: true,
        data: newRecord,
        message: `${body.type === 'reward' ? 'Reward' : 'Penalty'} created successfully`,
      }
    }

    return { status: false, message: 'Method not allowed' }
  }
  catch (error: any) {
    console.error('RewardPenalty API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
