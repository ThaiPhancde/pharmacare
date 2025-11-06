import { ShiftModel } from '~/server/models/HRExtended'
import { Invoice } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { employee, date, shift_id } = query

    if (!employee && !shift_id) {
      return {
        status: false,
        message: 'Cần cung cấp employee hoặc shift_id',
      }
    }

    // Lấy thông tin ca làm việc
    let shift
    if (shift_id) {
      shift = await ShiftModel.findById(shift_id).populate('employee', 'name position')
    }
    else if (employee && date) {
      const startOfDay = new Date(date as string)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date as string)
      endOfDay.setHours(23, 59, 59, 999)

      shift = await ShiftModel.findOne({
        employee,
        shift_date: { $gte: startOfDay, $lte: endOfDay },
      }).populate('employee', 'name position')
    }

    if (!shift) {
      return {
        status: false,
        message: 'Không tìm thấy ca làm việc',
      }
    }

    // Lấy các hóa đơn trong ca
    const shiftStart = new Date(shift.shift_date)
    const [startHour, startMin] = shift.start_time.split(':')
    shiftStart.setHours(Number.parseInt(startHour), Number.parseInt(startMin), 0, 0)

    const shiftEnd = new Date(shift.shift_date)
    const [endHour, endMin] = shift.end_time.split(':')
    shiftEnd.setHours(Number.parseInt(endHour), Number.parseInt(endMin), 59, 999)

    const invoices = await Invoice.find({
      created_by: shift.employee._id,
      createdAt: { $gte: shiftStart, $lte: shiftEnd },
    }).populate('customer', 'name phone')

    // Tính toán thống kê
    const totalInvoices = invoices.length
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0)
    const totalCash = invoices.filter(inv => inv.payment_method === 'cash')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalCard = invoices.filter(inv => inv.payment_method === 'card')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    const totalTransfer = invoices.filter(inv => inv.payment_method === 'transfer')
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

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
          status: shift.status,
        },
        summary: {
          total_invoices: totalInvoices,
          total_revenue: totalRevenue,
          total_discount: totalDiscount,
          total_cash: totalCash,
          total_card: totalCard,
          total_transfer: totalTransfer,
          net_revenue: totalRevenue - totalDiscount,
        },
        invoices: invoices.map(inv => ({
          _id: inv._id,
          invoice_number: inv.invoice_number,
          customer: inv.customer,
          total_amount: inv.total_amount,
          discount: inv.discount,
          payment_method: inv.payment_method,
          createdAt: inv.createdAt,
        })),
      },
      message: 'Lấy báo cáo kết ca thành công',
    }
  }
  catch (error: any) {
    console.error('Shift Closing Report Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
