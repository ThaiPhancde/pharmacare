import { VoucherModel, VoucherUsageModel } from '~/server/models/Voucher'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { voucher_code, customer_id, subtotal, items } = body

    if (!voucher_code || !subtotal) {
      return {
        status: false,
        message: 'Thiếu thông tin voucher hoặc tổng tiền',
      }
    }

    // Find voucher
    const voucher = await VoucherModel.findOne({
      voucher_code: voucher_code.toUpperCase(),
    })

    if (!voucher) {
      return {
        status: false,
        message: 'Mã voucher không tồn tại',
      }
    }

    // Check voucher status
    if (voucher.status !== 'active') {
      return {
        status: false,
        message: 'Voucher không hoạt động hoặc đã hết hạn',
      }
    }

    // Check date validity
    const now = new Date()
    if (now < voucher.start_date) {
      return {
        status: false,
        message: 'Voucher chưa có hiệu lực',
      }
    }
    if (now > voucher.end_date) {
      voucher.status = 'expired'
      await voucher.save()
      return {
        status: false,
        message: 'Voucher đã hết hạn',
      }
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return {
        status: false,
        message: 'Voucher đã hết lượt sử dụng',
      }
    }

    // Check usage per customer
    if (customer_id && voucher.usage_limit_per_customer) {
      const usageCount = await VoucherUsageModel.countDocuments({
        voucher: voucher._id,
        customer: customer_id,
      })

      if (usageCount >= voucher.usage_limit_per_customer) {
        return {
          status: false,
          message: `Bạn đã sử dụng voucher này ${voucher.usage_limit_per_customer} lần`,
        }
      }
    }

    // Check minimum purchase amount
    if (voucher.min_purchase_amount && subtotal < voucher.min_purchase_amount) {
      return {
        status: false,
        message: `Đơn hàng tối thiểu ${voucher.min_purchase_amount.toLocaleString('vi-VN')} VNĐ`,
      }
    }

    // Check applicable items
    if (voucher.applicable_to !== 'all' && voucher.applicable_items && voucher.applicable_items.length > 0) {
      // If voucher applies to specific items, check if any item in cart matches
      const hasApplicableItem = items?.some((item: any) =>
        voucher.applicable_items?.some(id => id.toString() === item.medicine?._id?.toString()),
      )

      if (!hasApplicableItem) {
        return {
          status: false,
          message: 'Voucher không áp dụng cho các sản phẩm trong đơn hàng',
        }
      }
    }

    // Calculate discount
    let discount = 0
    if (voucher.discount_type === 'percentage') {
      discount = (subtotal * voucher.discount_value) / 100
      if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
        discount = voucher.max_discount_amount
      }
    }
    else if (voucher.discount_type === 'fixed') {
      discount = voucher.discount_value
    }

    discount = Math.min(discount, subtotal)

    return {
      status: true,
      data: {
        voucher_id: voucher._id,
        voucher_code: voucher.voucher_code,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        discount_amount: discount,
        final_amount: subtotal - discount,
      },
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
