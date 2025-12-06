import { Invoice } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { start_date, end_date, customer, payment_method, payment_status } = query

    const filter: any = { is_pos: false }

    // Date filter
    if (start_date || end_date) {
      filter.date = {}
      if (start_date) filter.date.$gte = new Date(start_date as string)
      if (end_date) {
        const endDate = new Date(end_date as string)
        endDate.setHours(23, 59, 59, 999)
        filter.date.$lte = endDate
      }
    }

    if (customer) filter.customer = customer
    if (payment_method) filter.payment_method = payment_method
    if (payment_status) filter.payment_status = payment_status

    const invoices = await Invoice.find(filter)
      .populate('customer', 'name phone')
      .populate('items.medicine', 'name')
      .sort({ date: -1 })

    // Calculate totals
    const totalSales = invoices.reduce((sum, inv) => sum + inv.grand_total, 0)
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid, 0)
    const totalDue = invoices.reduce((sum, inv) => sum + inv.due, 0)
    const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0)
    const totalVAT = invoices.reduce((sum, inv) => sum + inv.vat_total, 0)

    return {
      status: true,
      data: invoices,
      total: invoices.length,
      summary: {
        total_sales: totalSales,
        total_paid: totalPaid,
        total_due: totalDue,
        total_discount: totalDiscount,
        total_vat: totalVAT,
        total_invoices: invoices.length,
      },
      message: 'Lấy báo cáo bán hàng thành công',
    }
  }
  catch (error: any) {
    console.error('Sales Report Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
