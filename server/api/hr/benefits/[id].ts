import { BenefitModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = event.context.params?.id

    if (!id) {
      return {
        status: false,
        message: 'ID phúc lợi không hợp lệ',
      }
    }

    // GET - Get benefit detail
    if (method === 'GET') {
      const benefit = await BenefitModel.findById(id).populate('employee', 'name position')
      if (!benefit) {
        return {
          status: false,
          message: 'Không tìm thấy phúc lợi',
        }
      }

      return {
        status: true,
        data: benefit,
        message: 'Lấy thông tin phúc lợi thành công',
      }
    }

    // PUT - Update benefit
    if (method === 'PUT') {
      const body = await readBody(event)
      const benefit = await BenefitModel.findByIdAndUpdate(id, body, { new: true })

      if (!benefit) {
        return {
          status: false,
          message: 'Không tìm thấy phúc lợi',
        }
      }

      return {
        status: true,
        data: benefit,
        message: 'Cập nhật phúc lợi thành công',
      }
    }

    // DELETE - Delete benefit
    if (method === 'DELETE') {
      await BenefitModel.findByIdAndDelete(id)

      return {
        status: true,
        message: 'Xóa phúc lợi thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Benefit Detail API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
