import { RewardPenalty } from '~/server/models'

// Approve or Reject a reward/penalty
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
    const { action, rejection_reason, approved_by } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return { status: false, message: 'Valid action (approve/reject) is required' }
    }

    const record = await RewardPenalty.findById(id)
    if (!record) {
      return { status: false, message: 'Record not found' }
    }

    if (record.status !== 'pending') {
      return { 
        status: false, 
        message: `Cannot ${action} a record that is already ${record.status}` 
      }
    }

    if (action === 'approve') {
      record.status = 'approved'
      record.approved_by = approved_by
      record.approved_date = new Date()
    } else {
      if (!rejection_reason) {
        return { status: false, message: 'Rejection reason is required' }
      }
      record.status = 'rejected'
      record.rejection_reason = rejection_reason
    }

    await record.save()
    await record.populate('employee', 'full_name email department')

    return {
      status: true,
      data: record,
      message: `Record ${action}d successfully`,
    }
  }
  catch (error: any) {
    console.error('RewardPenalty Approve API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
