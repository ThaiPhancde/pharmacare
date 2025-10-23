import { Voucher } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    const method = event.method

    if (!id) {
      return {
        status: false,
        message: 'Voucher ID is required'
      }
    }

    // GET - Get voucher by ID
    if (method === 'GET') {
      const voucher = await Voucher.findById(id)
      
      if (!voucher) {
        return {
          status: false,
          message: 'Không tìm thấy voucher'
        }
      }

      return {
        status: true,
        data: voucher,
        message: 'Lấy thông tin voucher thành công'
      }
    }

    // PUT - Update voucher
    if (method === 'PUT') {
      const body = await readBody(event)
      
      const voucher = await Voucher.findById(id)
      
      if (!voucher) {
        return {
          status: false,
          message: 'Không tìm thấy voucher'
        }
      }

      // If changing voucher code, check uniqueness
      if (body.voucher_code && body.voucher_code !== voucher.voucher_code) {
        const existingVoucher = await Voucher.findOne({ 
          voucher_code: body.voucher_code.toUpperCase(),
          _id: { $ne: id }
        })
        
        if (existingVoucher) {
          return {
            status: false,
            message: 'Mã voucher đã tồn tại!'
          }
        }
        body.voucher_code = body.voucher_code.toUpperCase()
      }

      Object.assign(voucher, body)
      await voucher.save()

      return {
        status: true,
        data: voucher,
        message: 'Cập nhật voucher thành công'
      }
    }

    // DELETE - Delete voucher
    if (method === 'DELETE') {
      const voucher = await Voucher.findByIdAndDelete(id)
      
      if (!voucher) {
        return {
          status: false,
          message: 'Không tìm thấy voucher'
        }
      }

      return {
        status: true,
        message: 'Xóa voucher thành công'
      }
    }

    return {
      status: false,
      message: 'Method not allowed'
    }
  } catch (error: any) {
    console.error('Voucher Detail API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server'
    }
  }
})
