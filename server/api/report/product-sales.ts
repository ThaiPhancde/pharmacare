import { Invoice } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { start_date, end_date, medicine } = query

    const filter: any = {}

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

    if (medicine) filter['items.medicine'] = medicine

    const invoices = await Invoice.find(filter)
      .populate('items.medicine', 'name')
      .populate('customer', 'name')

    // Group by medicine
    const medicineReport: any = {}

    for (const invoice of invoices) {
      for (const item of invoice.items) {
        const medicineId = item.medicine.toString()
        const medicineName = (item as any).medicine?.name || item.medicine_name || 'Unknown'

        if (!medicineReport[medicineId]) {
          medicineReport[medicineId] = {
            medicine_id: medicineId,
            medicine_name: medicineName,
            total_quantity: 0,
            total_amount: 0,
            total_invoices: 0,
            invoices: [],
          }
        }

        medicineReport[medicineId].total_quantity += item.quantity
        medicineReport[medicineId].total_amount += item.subtotal
        medicineReport[medicineId].total_invoices += 1
        medicineReport[medicineId].invoices.push({
          invoice_no: invoice.invoice_no,
          date: invoice.date,
          customer: (invoice as any).customer?.name || 'Walk-in',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })
      }
    }

    const reportData = Object.values(medicineReport)
      .sort((a: any, b: any) => b.total_amount - a.total_amount)

    return {
      status: true,
      data: reportData,
      total: reportData.length,
      message: 'Lấy báo cáo bán hàng theo sản phẩm thành công',
    }
  }
  catch (error: any) {
    console.error('Product Sales Report Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
