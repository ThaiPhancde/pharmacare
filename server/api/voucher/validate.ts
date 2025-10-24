import { Voucher, VoucherUsageModel } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { voucher_code, invoice_total, customer_id, items } = body

    if (!voucher_code) {
      return {
        status: false,
        message: 'Vui lòng nhập mã voucher'
      }
    }

    // Find voucher
    const voucher = await Voucher.findOne({ 
      voucher_code: voucher_code.toUpperCase() 
    })

    if (!voucher) {
      return {
        status: false,
        message: 'Mã voucher không tồn tại'
      }
    }

    // Check voucher status
    if (voucher.status !== 'active') {
      return {
        status: false,
        message: 'Voucher không còn hiệu lực'
      }
    }

    // Check date validity
    const now = new Date()
    if (now < voucher.start_date || now > voucher.end_date) {
      return {
        status: false,
        message: 'Voucher đã hết hạn hoặc chưa bắt đầu'
      }
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
      return {
        status: false,
        message: 'Voucher đã hết lượt sử dụng'
      }
    }

    // Check minimum purchase amount
    if (voucher.min_purchase_amount && invoice_total < voucher.min_purchase_amount) {
      return {
        status: false,
        message: `Đơn hàng tối thiểu ${voucher.min_purchase_amount.toLocaleString()}đ để áp dụng voucher này`
      }
    }

    // Check usage limit per customer
    if (customer_id && voucher.usage_limit_per_customer) {
      const usageCount = await VoucherUsageModel.countDocuments({
        voucher: voucher._id,
        customer: customer_id
      })
      
      if (usageCount >= voucher.usage_limit_per_customer) {
        return {
          status: false,
          message: 'Bạn đã sử dụng hết lượt áp dụng voucher này'
        }
      }
    }

    // Check applicable items
    if (voucher.applicable_to !== 'all' && items && items.length > 0) {
      const applicableItemIds = voucher.applicable_items?.map(id => id.toString()) || []
      let isApplicable = false

      for (const item of items) {
        if (voucher.applicable_to === 'medicine') {
          if (applicableItemIds.includes(item.medicine.toString())) {
            isApplicable = true
            break
          }
        }
        // Add more checks for category, service, etc.
      }

      if (!isApplicable) {
        return {
          status: false,
          message: 'Voucher không áp dụng cho sản phẩm trong giỏ hàng'
        }
      }
    }

    // Calculate discount
    let discount_amount = 0
    if (voucher.discount_type === 'percentage') {
      discount_amount = (invoice_total * voucher.discount_value) / 100
      if (voucher.max_discount_amount && discount_amount > voucher.max_discount_amount) {
        discount_amount = voucher.max_discount_amount
      }
    } else {
      discount_amount = voucher.discount_value
    }

    return {
      status: true,
      data: {
        voucher_id: voucher._id,
        voucher_code: voucher.voucher_code,
        voucher_name: voucher.name,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        discount_amount,
        final_total: invoice_total - discount_amount
      },
      message: 'Áp dụng voucher thành công'
    }
  } catch (error: any) {
    console.error('Validate Voucher Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server'
    }
  }
})
