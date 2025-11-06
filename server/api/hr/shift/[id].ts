import { ShiftModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = event.context.params?.id

    if (!id) {
      return {
        status: false,
        message: 'ID ca làm việc không hợp lệ',
      }
    }

    // GET - Get shift detail
    if (method === 'GET') {
      const shift = await ShiftModel.findById(id).populate('employee', 'name position')
      if (!shift) {
        return {
          status: false,
          message: 'Không tìm thấy ca làm việc',
        }
      }

      return {
        status: true,
        data: shift,
        message: 'Lấy thông tin ca làm việc thành công',
      }
    }

    // PUT - Update shift
    if (method === 'PUT') {
      const body = await readBody(event)
      const shift = await ShiftModel.findByIdAndUpdate(id, body, { new: true })

      if (!shift) {
        return {
          status: false,
          message: 'Không tìm thấy ca làm việc',
        }
      }

      return {
        status: true,
        data: shift,
        message: 'Cập nhật ca làm việc thành công',
      }
    }

    // DELETE - Delete shift
    if (method === 'DELETE') {
      await ShiftModel.findByIdAndDelete(id)

      return {
        status: true,
        message: 'Xóa ca làm việc thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Shift Detail API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
