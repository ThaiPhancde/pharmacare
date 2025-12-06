import { Purchase } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { start_date, end_date, supplier } = query

    const filter: any = {}

    // Date filter
    if (start_date || end_date) {
      filter.purchase_date = {}
      if (start_date) filter.purchase_date.$gte = new Date(start_date as string)
      if (end_date) {
        const endDate = new Date(end_date as string)
        endDate.setHours(23, 59, 59, 999)
        filter.purchase_date.$lte = endDate
      }
    }

    if (supplier) filter.supplier_id = supplier

    const purchases = await Purchase.find(filter)
      .populate('supplier_id', 'name phone')
      .populate('medicine_id', 'name')
      .sort({ purchase_date: -1 })

    // Calculate totals
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount, 0)
    const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0)

    return {
      status: true,
      data: purchases,
      total: purchases.length,
      summary: {
        total_purchases: totalPurchases,
        total_quantity: totalQuantity,
        total_orders: purchases.length,
      },
      message: 'Lấy báo cáo mua hàng thành công',
    }
  }
  catch (error: any) {
    console.error('Purchase Report Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
