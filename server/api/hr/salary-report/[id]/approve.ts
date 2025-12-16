import { SalaryReport } from '~/server/models'

// Approve or Finalize salary report
export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = getRouterParam(event, 'id')

    if (method !== 'POST') {
      return { status: false, message: 'Method not allowed' }
    }

    if (!id) {
      return { status: false, message: 'ID is required' }
    }

    const body = await readBody(event)
    const { action, user_id } = body

    if (!action || !['approve', 'finalize'].includes(action)) {
      return { status: false, message: 'Valid action (approve/finalize) is required' }
    }

    const report = await SalaryReport.findById(id)
    if (!report) {
      return { status: false, message: 'Salary report not found' }
    }

    if (action === 'approve') {
      if (report.status !== 'calculated') {
        return { 
          status: false, 
          message: 'Only calculated reports can be approved' 
        }
      }
      report.status = 'approved'
      report.approved_by = user_id
      report.approved_at = new Date()
    } else if (action === 'finalize') {
      if (report.status !== 'approved') {
        return { 
          status: false, 
          message: 'Only approved reports can be finalized' 
        }
      }
      report.status = 'finalized'
      report.finalized_by = user_id
      report.finalized_at = new Date()
    }

    await report.save()
    await report.populate('employee', 'full_name email department')

    return {
      status: true,
      data: report,
      message: `Salary report ${action}d successfully`,
    }
  }
  catch (error: any) {
    console.error('SalaryReport Approve API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
