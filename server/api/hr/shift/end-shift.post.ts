import { ShiftModel } from '~/server/models/HRExtended'
import { Invoice } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { shift_id, closing_balance, notes } = body

    if (!shift_id) {
      return {
        status: false,
        message: 'Shift ID is required',
      }
    }

    const shift = await ShiftModel.findById(shift_id).populate('employee', 'name position')

    if (!shift) {
      return {
        status: false,
        message: 'Shift not found',
      }
    }

    // Check if shift is active
    if (shift.status !== 'active') {
      return {
        status: false,
        message: `Shift is not active. Current status: ${shift.status}`,
      }
    }

    // Calculate shift duration
    const actualStartTime = shift.actual_start_time || new Date(shift.shift_date)
    const actualEndTime = new Date()
    const durationMs = actualEndTime.getTime() - actualStartTime.getTime()
    const hoursWorked = durationMs / (1000 * 60 * 60)

    // Get all invoices for this shift
    const invoices = await Invoice.find({
      shift: shift._id,
      is_pos: true,
    })

    // Calculate statistics
    const totalInvoices = invoices.length
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0)
    const totalCash = invoices
      .filter(inv => inv.payment_method === 'cash')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalCard = invoices
      .filter(inv => inv.payment_method === 'card')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalBank = invoices
      .filter(inv => inv.payment_method === 'bank')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalMomo = invoices
      .filter(inv => inv.payment_method === 'momo')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)

    // End the shift
    shift.status = 'completed'
    shift.actual_end_time = actualEndTime
    shift.hours_worked = Math.round(hoursWorked * 100) / 100 // Round to 2 decimal places
    if (closing_balance !== undefined) {
      shift.closing_balance = Number(closing_balance) || 0
    }
    if (notes) {
      shift.notes = notes
    }
    await shift.save()

    return {
      status: true,
      data: {
        shift: {
          _id: shift._id,
          employee: shift.employee,
          shift_date: shift.shift_date,
          shift_type: shift.shift_type,
          start_time: shift.start_time,
          end_time: shift.end_time,
          actual_start_time: shift.actual_start_time,
          actual_end_time: shift.actual_end_time,
          opening_balance: shift.opening_balance,
          closing_balance: shift.closing_balance,
          hours_worked: shift.hours_worked,
          status: shift.status,
        },
        summary: {
          total_invoices: totalInvoices,
          total_revenue: totalRevenue,
          total_discount: totalDiscount,
          total_cash: totalCash,
          total_card: totalCard,
          total_bank: totalBank,
          total_momo: totalMomo,
          net_revenue: totalRevenue - totalDiscount,
          expected_cash: (shift.opening_balance || 0) + totalCash,
          actual_cash: shift.closing_balance || 0,
          cash_difference: (shift.closing_balance || 0) - ((shift.opening_balance || 0) + totalCash),
        },
      },
      message: 'Shift ended successfully',
    }
  } catch (error: any) {
    console.error('End Shift Error:', error)
    return {
      status: false,
      message: error.message || 'Failed to end shift',
    }
  }
})

