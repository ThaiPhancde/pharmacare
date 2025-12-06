import { Employee } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all employees
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, department, designation, search, page, limit } = query

      const filter: any = {}
      
      if (status) filter.status = status
      if (department) filter.department = department
      if (designation) filter.designation = designation
      if (search) {
        filter.$or = [
          { full_name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }

      // Pagination
      const pageNum = page ? parseInt(page as string) : 1
      const limitNum = limit ? parseInt(limit as string) : 10
      const skip = (pageNum - 1) * limitNum

      // Get total count
      const total = await Employee.countDocuments(filter)

      // Get paginated employees
      const employees = await Employee.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)

      return {
        status: true,
        data: employees,
        total,
        page: pageNum,
        limit: limitNum,
        message: 'Employee list loaded successfully',
      }
    }

    // POST - Create new employee
    if (method === 'POST') {
      const body = await readBody(event)
      
      console.log('Creating employee with data:', JSON.stringify(body, null, 2))

      // Validate required fields
      if (!body.full_name || !body.full_name.trim()) {
        return {
          status: false,
          message: 'Full name is required',
        }
      }

      if (!body.email || !body.email.trim()) {
        return {
          status: false,
          message: 'Email is required',
        }
      }

      if (!body.phone || !body.phone.trim()) {
        return {
          status: false,
          message: 'Phone number is required',
        }
      }

      if (!body.designation || !body.designation.trim()) {
        return {
          status: false,
          message: 'Designation is required',
        }
      }

      if (!body.department || !body.department.trim()) {
        return {
          status: false,
          message: 'Department is required',
        }
      }

      if (!body.date_of_joining) {
        return {
          status: false,
          message: 'Date of joining is required',
        }
      }

      if (!body.salary_basic || Number(body.salary_basic) < 500000) {
        return {
          status: false,
          message: 'Basic salary must be at least 500,000 VND',
        }
      }

      // Check duplicate email (case insensitive)
      const existingByEmail = await Employee.findOne({
        email: { $regex: new RegExp(`^${body.email.trim()}$`, 'i') }
      })

      if (existingByEmail) {
        return {
          status: false,
          message: `Email "${body.email}" already exists!`,
        }
      }

      // Normalize email to lowercase
      body.email = body.email.trim().toLowerCase()

      // Ensure date_of_joining is a Date object
      if (body.date_of_joining) {
        if (typeof body.date_of_joining === 'string') {
          const doj = new Date(body.date_of_joining)
          if (isNaN(doj.getTime())) {
            return {
              status: false,
              message: 'Invalid date of joining format',
            }
          }
          body.date_of_joining = doj
        } else if (body.date_of_joining instanceof Date) {
          // Already a Date object
          if (isNaN(body.date_of_joining.getTime())) {
            return {
              status: false,
              message: 'Invalid date of joining',
            }
          }
        }
      }

      // Ensure date_of_birth is a Date object if provided
      if (body.date_of_birth) {
        if (typeof body.date_of_birth === 'string') {
          const dob = new Date(body.date_of_birth)
          if (!isNaN(dob.getTime())) {
            body.date_of_birth = dob
          } else {
            // Invalid date, remove it
            delete body.date_of_birth
          }
        } else if (body.date_of_birth instanceof Date) {
          if (isNaN(body.date_of_birth.getTime())) {
            delete body.date_of_birth
          }
        }
      }

      // Ensure salary_basic is a number
      body.salary_basic = Number(body.salary_basic)

      // Generate unique employee_id (UUID) if not provided
      if (!body.employee_id || !body.employee_id.trim()) {
        // Generate UUID v4
        const { randomUUID } = await import('crypto')
        body.employee_id = randomUUID()
        console.log('Generated employee_id:', body.employee_id)
      }

      try {
        const newEmployee = new Employee(body)
        await newEmployee.save()

        console.log('Employee created successfully:', newEmployee._id)

        return {
          status: true,
          data: newEmployee,
          message: 'Employee created successfully',
        }
      } catch (saveError: any) {
        console.error('Error saving employee:', saveError)
        return {
          status: false,
          message: saveError.message || 'Failed to save employee',
        }
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
      message: error.message || 'Internal server error',
    }
  }
})

