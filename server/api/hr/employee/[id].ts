import { Employee } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    const method = event.method

    if (!id) {
      return {
        status: false,
        message: 'Employee ID is required',
      }
    }

    // GET - Get employee by ID
    if (method === 'GET') {
      const employee = await Employee.findById(id)
      
      if (!employee) {
        return {
          status: false,
          message: 'Không tìm thấy nhân viên',
        }
      }

      return {
        status: true,
        data: employee,
        message: 'Lấy thông tin nhân viên thành công',
      }
    }

    // PUT - Update employee
    if (method === 'PUT') {
      const body = await readBody(event)
      
      const employee = await Employee.findByIdAndUpdate(id, body, { new: true })
      
      if (!employee) {
        return {
          status: false,
          message: 'Không tìm thấy nhân viên',
        }
      }

      return {
        status: true,
        data: employee,
        message: 'Cập nhật nhân viên thành công',
      }
    }

    // DELETE - Delete employee
    if (method === 'DELETE') {
      const employee = await Employee.findByIdAndDelete(id)
      
      if (!employee) {
        return {
          status: false,
          message: 'Không tìm thấy nhân viên',
        }
      }

      return {
        status: true,
        message: 'Xóa nhân viên thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Employee Detail API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
