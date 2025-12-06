import { ShiftModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { employee_id } = query

    const filter: any = {
      status: 'active',
    }

    if (employee_id) {
      filter.employee = employee_id
    }

    const activeShift = await ShiftModel.findOne(filter)
      .populate('employee', 'full_name name position')
      .sort({ actual_start_time: -1 })

    if (!activeShift) {
      return {
        status: true,
        data: null,
        message: 'No active shift found',
      }
    }

    return {
      status: true,
      data: activeShift,
      message: 'Active shift retrieved successfully',
    }
  } catch (error: any) {
    console.error('Get Active Shift Error:', error)
    return {
      status: false,
      message: error.message || 'Failed to get active shift',
    }
  }
})

