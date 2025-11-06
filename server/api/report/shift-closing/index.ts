import mongoose from 'mongoose'

// Sử dụng lại schema từ close.post.ts
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
    const query = getQuery(event)
    const { employee, start_date, end_date, page = 1, limit = 20 } = query

    const filter: any = {}

    if (employee)
      filter.employee = employee

    if (start_date || end_date) {
      filter.closing_date = {}
      if (start_date) {
        const start = new Date(start_date as string)
        start.setHours(0, 0, 0, 0)
        filter.closing_date.$gte = start
      }
      if (end_date) {
        const end = new Date(end_date as string)
        end.setHours(23, 59, 59, 999)
        filter.closing_date.$lte = end
      }
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [closings, total] = await Promise.all([
      ShiftClosing.find(filter)
        .populate('employee', 'name position')
        .populate('shift')
        .sort({ closing_date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ShiftClosing.countDocuments(filter),
    ])

    return {
      status: true,
      data: closings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      message: 'Lấy lịch sử kết ca thành công',
    }
  }
  catch (error: any) {
    console.error('Shift Closing History Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
