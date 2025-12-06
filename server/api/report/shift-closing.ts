import { ShiftModel } from '~/server/models/HRExtended'
import { Invoice } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { employee, date, shift_id } = query

    if (!employee && !shift_id) {
      return {
        status: false,
        message: 'Employee or shift_id is required',
      }
    }

    // Lấy thông tin ca làm việc
    let shift
    if (shift_id) {
      shift = await ShiftModel.findById(shift_id).populate('employee', 'full_name name position')
    }
    else if (employee && date) {
      const startOfDay = new Date(date as string)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date as string)
      endOfDay.setHours(23, 59, 59, 999)

      shift = await ShiftModel.findOne({
        employee,
        shift_date: { $gte: startOfDay, $lte: endOfDay },
      }).populate('employee', 'full_name name position')
    }

    if (!shift) {
      return {
        status: false,
        message: 'Shift not found',
      }
    }

    // Lấy các hóa đơn trong ca
    const shiftStart = new Date(shift.shift_date)
    const [startHour, startMin] = shift.start_time.split(':')
    shiftStart.setHours(Number.parseInt(startHour), Number.parseInt(startMin), 0, 0)

    const shiftEnd = new Date(shift.shift_date)
    const [endHour, endMin] = shift.end_time.split(':')
    shiftEnd.setHours(Number.parseInt(endHour), Number.parseInt(endMin), 59, 999)

    // Get invoices by shift_id (preferred) or by employee and time range
    let invoices;
    if (shift._id) {
      invoices = await Invoice.find({
        shift: shift._id,
        is_pos: true,
      }).populate('customer', 'full_name contact_info').sort({ createdAt: 1 });
    } else {
      // Fallback: find by employee and time range
      invoices = await Invoice.find({
        created_by: shift.employee._id,
        createdAt: { $gte: shiftStart, $lte: shiftEnd },
        is_pos: true,
      }).populate('customer', 'full_name contact_info').sort({ createdAt: 1 });
    }

    // Tính toán thống kê
    const totalInvoices = invoices.length
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discount || 0) + (inv.voucher_discount || 0), 0)
    const totalVAT = invoices.reduce((sum, inv) => sum + (inv.vat_total || 0), 0)
    const totalCash = invoices.filter(inv => inv.payment_method === 'cash')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalCard = invoices.filter(inv => inv.payment_method === 'card')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalBank = invoices.filter(inv => inv.payment_method === 'bank')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)
    const totalMomo = invoices.filter(inv => inv.payment_method === 'momo')
      .reduce((sum, inv) => sum + (inv.paid || 0), 0)

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
          total_vat: totalVAT,
          total_cash: totalCash,
          total_card: totalCard,
          total_bank: totalBank,
          total_momo: totalMomo,
          net_revenue: totalRevenue - totalDiscount,
          opening_balance: shift.opening_balance || 0,
          closing_balance: shift.closing_balance || 0,
          expected_cash: (shift.opening_balance || 0) + totalCash,
          cash_difference: (shift.closing_balance || 0) - ((shift.opening_balance || 0) + totalCash),
        },
        invoices: invoices.map(inv => ({
          _id: inv._id,
          invoice_no: inv.invoice_no || inv._id,
          customer: inv.customer,
          grand_total: inv.grand_total,
          discount: (inv.discount || 0) + (inv.voucher_discount || 0),
          payment_method: inv.payment_method,
          paid: inv.paid,
          due: inv.due,
          createdAt: inv.createdAt,
          items: inv.items || [], // Thêm items để hiển thị sản phẩm đã bán
        })),
      },
      message: 'Shift closing report loaded successfully',
    }
  }
  catch (error: any) {
    console.error('Shift Closing Report Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
