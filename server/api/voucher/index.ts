import { Voucher } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all vouchers with filters
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, applicable_to, search } = query

      const filter: any = {}
      
      if (status) filter.status = status
      if (applicable_to) filter.applicable_to = applicable_to
      if (search) {
        filter.$or = [
          { voucher_code: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } }
        ]
      }

      const vouchers = await Voucher.find(filter).sort({ createdAt: -1 })

      // Check and update expired vouchers
      const now = new Date()
      for (const voucher of vouchers) {
        if (voucher.end_date < now && voucher.status !== 'expired') {
          voucher.status = 'expired'
          await voucher.save()
        }
      }

      return {
        status: true,
        data: vouchers,
        total: vouchers.length,
        message: 'Lấy danh sách voucher thành công'
      }
    }

    // POST - Create new voucher
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Validate voucher code uniqueness
      const existingVoucher = await Voucher.findOne({ 
        voucher_code: body.voucher_code.toUpperCase() 
      })
      
      if (existingVoucher) {
        return {
          status: false,
          message: 'Mã voucher đã tồn tại!'
        }
      }

      // Set status based on dates
      const now = new Date()
      const startDate = new Date(body.start_date)
      const endDate = new Date(body.end_date)

      let status = 'active'
      if (endDate < now) {
        status = 'expired'
      } else if (startDate > now) {
        status = 'inactive'
      }

      const newVoucher = new Voucher({
        ...body,
        voucher_code: body.voucher_code.toUpperCase(),
        status,
        usage_count: 0
      })

      await newVoucher.save()

      return {
        status: true,
        data: newVoucher,
        message: 'Tạo voucher thành công'
      }
    }

    return {
      status: false,
      message: 'Method not allowed'
    }
  } catch (error: any) {
    console.error('Voucher API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server'
    }
  }
})
