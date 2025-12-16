import { RewardPenalty, Employee } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = getRouterParam(event, 'id')

    if (!id) {
      return { status: false, message: 'ID is required' }
    }

    // GET - Get single reward/penalty by ID
    if (method === 'GET') {
      const record = await RewardPenalty.findById(id)
        .populate('employee', 'full_name email department designation employee_id salary_basic')
        .populate('approved_by', 'name email')
        .populate('created_by', 'name email')

      if (!record) {
        return { status: false, message: 'Record not found' }
      }

      return {
        status: true,
        data: record,
        message: 'Record loaded successfully',
      }
    }

    // PUT - Update reward/penalty
    if (method === 'PUT') {
      const body = await readBody(event)

      // Check if record exists
      const existingRecord = await RewardPenalty.findById(id)
      if (!existingRecord) {
        return { status: false, message: 'Record not found' }
      }

      // Don't allow updating if already applied to salary
      if (existingRecord.status === 'applied') {
        return { 
          status: false, 
          message: 'Cannot update record that has already been applied to salary' 
        }
      }

      // If employee is being changed, validate
      if (body.employee && body.employee !== existingRecord.employee.toString()) {
        const employeeExists = await Employee.findById(body.employee)
        if (!employeeExists) {
          return { status: false, message: 'Employee not found' }
        }
      }

      // Update month/year if effective_date changes
      if (body.effective_date) {
        const effectiveDate = new Date(body.effective_date)
        body.month = effectiveDate.getMonth() + 1
        body.year = effectiveDate.getFullYear()
      }

      const updatedRecord = await RewardPenalty.findByIdAndUpdate(
        id,
        body,
        { new: true, runValidators: true }
      ).populate('employee', 'full_name email department')

      return {
        status: true,
        data: updatedRecord,
        message: 'Record updated successfully',
      }
    }

    // DELETE - Delete reward/penalty
    if (method === 'DELETE') {
      const existingRecord = await RewardPenalty.findById(id)
      if (!existingRecord) {
        return { status: false, message: 'Record not found' }
      }

      // Don't allow deleting if already applied to salary
      if (existingRecord.status === 'applied') {
        return { 
          status: false, 
          message: 'Cannot delete record that has already been applied to salary' 
        }
      }

      await RewardPenalty.findByIdAndDelete(id)

      return {
        status: true,
        message: 'Record deleted successfully',
      }
    }

    return { status: false, message: 'Method not allowed' }
  }
  catch (error: any) {
    console.error('RewardPenalty [id] API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
