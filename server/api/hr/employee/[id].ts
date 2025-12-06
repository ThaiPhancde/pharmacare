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
          message: 'Employee not found',
        }
      }

      return {
        status: true,
        data: employee,
        message: 'Employee information retrieved successfully',
      }
    }

    // PUT - Update employee
    if (method === 'PUT') {
      const body = await readBody(event)
      
      // Validate salary_basic if provided
      if (body.salary_basic !== undefined && Number(body.salary_basic) < 500000) {
        return {
          status: false,
          message: 'Basic salary must be at least 500,000 VND',
        }
      }
      
      const employee = await Employee.findByIdAndUpdate(id, body, { new: true })
      
      if (!employee) {
        return {
          status: false,
          message: 'Employee not found',
        }
      }

      return {
        status: true,
        data: employee,
        message: 'Employee updated successfully',
      }
    }

    // DELETE - Delete employee
    if (method === 'DELETE') {
      const employee = await Employee.findByIdAndDelete(id)
      
      if (!employee) {
        return {
          status: false,
          message: 'Employee not found',
        }
      }

      return {
        status: true,
        message: 'Employee deleted successfully',
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
      message: error.message || 'Internal server error',
    }
  }
})
