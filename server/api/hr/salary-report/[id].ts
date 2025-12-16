import { SalaryReport } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = getRouterParam(event, 'id')

    if (!id) {
      return { status: false, message: 'ID is required' }
    }

    // GET - Get single salary report by ID
    if (method === 'GET') {
      const report = await SalaryReport.findById(id)
        .populate('employee', 'full_name email department designation employee_id salary_basic bank_account bank_name')
        .populate('approved_by', 'name email')
        .populate('finalized_by', 'name email')
        .populate('created_by', 'name email')

      if (!report) {
        return { status: false, message: 'Salary report not found' }
      }

      return {
        status: true,
        data: report,
        message: 'Salary report loaded successfully',
      }
    }

    // PUT - Update salary report
    if (method === 'PUT') {
      const body = await readBody(event)

      const existingReport = await SalaryReport.findById(id)
      if (!existingReport) {
        return { status: false, message: 'Salary report not found' }
      }

      if (existingReport.status === 'finalized') {
        return { status: false, message: 'Cannot update a finalized salary report' }
      }

      // Prevent changing employee, month, year
      delete body.employee
      delete body.month
      delete body.year

      const updatedReport = await SalaryReport.findByIdAndUpdate(
        id,
        body,
        { new: true, runValidators: true }
      ).populate('employee', 'full_name email department')

      return {
        status: true,
        data: updatedReport,
        message: 'Salary report updated successfully',
      }
    }

    // DELETE - Delete salary report
    if (method === 'DELETE') {
      const existingReport = await SalaryReport.findById(id)
      if (!existingReport) {
        return { status: false, message: 'Salary report not found' }
      }

      if (existingReport.status === 'finalized') {
        return { status: false, message: 'Cannot delete a finalized salary report' }
      }

      await SalaryReport.findByIdAndDelete(id)

      return {
        status: true,
        message: 'Salary report deleted successfully',
      }
    }

    return { status: false, message: 'Method not allowed' }
  }
  catch (error: any) {
    console.error('SalaryReport [id] API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
