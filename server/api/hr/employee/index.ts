import { Employee } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all employees
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, department, designation, search } = query

      const filter: any = {}
      
      if (status) filter.status = status
      if (department) filter.department = department
      if (designation) filter.designation = designation
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { employee_id: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }

      const employees = await Employee.find(filter).sort({ createdAt: -1 })

      return {
        status: true,
        data: employees,
        total: employees.length,
        message: 'Lấy danh sách nhân viên thành công',
      }
    }

    // POST - Create new employee
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Generate employee ID if not provided
      if (!body.employee_id) {
        const count = await Employee.countDocuments()
        body.employee_id = `EMP${String(count + 1).padStart(5, '0')}`
      }

      // Check duplicate employee_id or email
      const existing = await Employee.findOne({
        $or: [
          { employee_id: body.employee_id },
          { email: body.email }
        ]
      })

      if (existing) {
        return {
          status: false,
          message: 'Mã nhân viên hoặc email đã tồn tại!',
        }
      }

      const newEmployee = new Employee(body)
      await newEmployee.save()

      return {
        status: true,
        data: newEmployee,
        message: 'Thêm nhân viên thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Employee API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
