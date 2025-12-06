import { validateAndApplyVoucher } from '~/server/utils/voucher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      voucher_code,
      customer_id,
      subtotal,
      items,
      commit = false,
      invoice_id,
    } = body

    if (!voucher_code || !subtotal) {
      return {
        status: false,
        message: 'Thiếu thông tin voucher hoặc tổng tiền',
      }
    }

    const result = await validateAndApplyVoucher({
      voucher_code,
      customer_id,
      subtotal,
      items,
      commit,
      invoice_id,
    })

    return {
      status: true,
      data: result,
      message: 'Áp dụng voucher thành công',
    }
  }
  catch (error: any) {
    console.error('Apply Voucher API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
