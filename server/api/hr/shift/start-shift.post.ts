import { ShiftModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { shift_id, opening_balance } = body

    if (!shift_id) {
      return {
        status: false,
        message: 'Shift ID is required',
      }
    }

    const shift = await ShiftModel.findById(shift_id)

    if (!shift) {
      return {
        status: false,
        message: 'Shift not found',
      }
    }

    // Check if shift is already active
    if (shift.status === 'active') {
      return {
        status: false,
        message: 'Shift is already active',
      }
    }

    // Check if shift is already completed
    if (shift.status === 'completed') {
      return {
        status: false,
        message: 'Shift is already completed',
      }
    }

    // Start the shift
    shift.status = 'active'
    shift.actual_start_time = new Date()
    if (opening_balance !== undefined) {
      shift.opening_balance = Number(opening_balance) || 0
    }
    await shift.save()

    // Populate employee data before returning
    await shift.populate('employee', 'full_name name position')

    return {
      status: true,
      data: shift,
      message: 'Shift started successfully',
    }
  } catch (error: any) {
    console.error('Start Shift Error:', error)
    return {
      status: false,
      message: error.message || 'Failed to start shift',
    }
  } ``
})

