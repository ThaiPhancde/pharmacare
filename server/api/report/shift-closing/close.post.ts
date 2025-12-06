import { ShiftModel } from '~/server/models/HRExtended'
import mongoose from 'mongoose'

// Schema cho shift closing
const ShiftClosingSchema = new mongoose.Schema({
  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  closing_date: { type: Date, default: Date.now },
  opening_balance: { type: Number, default: 0 },
  expected_balance: { type: Number, required: true },
  actual_balance: { type: Number, required: true },
  discrepancy: { type: Number, default: 0 },
  total_invoices: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0 },
  total_cash: { type: Number, default: 0 },
  total_card: { type: Number, default: 0 },
  total_transfer: { type: Number, default: 0 },
  notes: { type: String },
  closed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const ShiftClosing = mongoose.models.ShiftClosing || mongoose.model('ShiftClosing', ShiftClosingSchema)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      shift_id,
      opening_balance,
      actual_balance,
      notes,
      summary,
    } = body

    if (!shift_id || actual_balance === undefined) {
      return {
        status: false,
        message: 'Missing shift_id or actual_balance',
      }
    }

    // Lấy thông tin ca
    const shift = await ShiftModel.findById(shift_id)
    if (!shift) {
      return {
        status: false,
        message: 'Shift not found',
      }
    }

    // Kiểm tra đã kết ca chưa
    const existingClosing = await ShiftClosing.findOne({ shift: shift_id })
    if (existingClosing) {
      return {
        status: false,
        message: 'This shift has already been closed',
      }
    }

    // Tính discrepancy
    const expectedBalance = (opening_balance || 0) + (summary?.total_cash || 0)
    const discrepancy = actual_balance - expectedBalance

    // Tạo bản ghi kết ca
    const shiftClosing = new ShiftClosing({
      shift: shift_id,
      employee: shift.employee,
      opening_balance: opening_balance || 0,
      expected_balance: expectedBalance,
      actual_balance,
      discrepancy,
      total_invoices: summary?.total_invoices || 0,
      total_revenue: summary?.total_revenue || 0,
      total_cash: summary?.total_cash || 0,
      total_card: summary?.total_card || 0,
      total_transfer: summary?.total_transfer || 0,
      notes,
    })

    await shiftClosing.save()

    // Cập nhật trạng thái ca
    shift.status = 'completed'
    await shift.save()

    return {
      status: true,
      data: shiftClosing,
      message: 'Shift closed successfully',
    }
  }
  catch (error: any) {
    console.error('Close Shift Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
