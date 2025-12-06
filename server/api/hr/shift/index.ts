import { ShiftModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all shifts
    if (method === 'GET') {
      const query = getQuery(event)
      const { employee, date, status, shift_type } = query

      const filter: any = {}
      if (employee)
        filter.employee = employee
      if (status)
        filter.status = status
      if (shift_type)
        filter.shift_type = shift_type
      if (date) {
        const startOfDay = new Date(date as string)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date as string)
        endOfDay.setHours(23, 59, 59, 999)
        filter.shift_date = { $gte: startOfDay, $lte: endOfDay }
      }

      const shifts = await ShiftModel.find(filter)
        .populate('employee', 'full_name name position')
        .sort({ shift_date: -1, createdAt: -1 })

      return {
        status: true,
        data: shifts,
        total: shifts.length,
        message: 'Shift list loaded successfully',
      }
    }

    // POST - Create new shift
    if (method === 'POST') {
      const body = await readBody(event)

      // Check if shift already exists for this employee on this date
      const existingShift = await ShiftModel.findOne({
        employee: body.employee,
        shift_date: body.shift_date,
      })

      if (existingShift) {
        return {
          status: false,
          message: 'This employee already has a shift on this date',
        }
      }

      const newShift = new ShiftModel(body)
      await newShift.save()

      return {
        status: true,
        data: newShift,
        message: 'Shift created successfully',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Shift API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
