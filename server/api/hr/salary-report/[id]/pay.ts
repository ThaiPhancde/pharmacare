import { SalaryReport } from '~/server/models'

// Mark salary report as paid
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
    const { payment_method, payment_reference, payment_date } = body

    const report = await SalaryReport.findById(id)
    if (!report) {
      return { status: false, message: 'Salary report not found' }
    }

    if (report.status !== 'finalized') {
      return { 
        status: false, 
        message: 'Only finalized reports can be marked as paid' 
      }
    }

    if (report.payment_status === 'paid') {
      return { 
        status: false, 
        message: 'Salary report is already marked as paid' 
      }
    }

    report.payment_status = 'paid'
    report.payment_date = payment_date ? new Date(payment_date) : new Date()
    report.payment_method = payment_method || 'bank_transfer'
    report.payment_reference = payment_reference || ''

    await report.save()
    await report.populate('employee', 'full_name email department bank_account bank_name')

    return {
      status: true,
      data: report,
      message: 'Payment recorded successfully',
    }
  }
  catch (error: any) {
    console.error('SalaryReport Pay API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
