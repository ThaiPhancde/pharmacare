import { RewardPenalty, Employee } from '~/server/models'

// Get statistics for rewards/penalties
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { month, year, employee, department } = query

    const currentDate = new Date()
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear()

    // Build match filter
    const matchFilter: any = {
      month: targetMonth,
      year: targetYear,
      status: { $in: ['approved', 'applied'] }
    }

    if (employee) {
      matchFilter.employee = employee
    }

    // Get department filter employees if needed
    let employeeIds: string[] = []
    if (department) {
      const deptEmployees = await Employee.find({ department }, '_id')
      employeeIds = deptEmployees.map(e => e._id.toString())
      if (employeeIds.length > 0) {
        matchFilter.employee = { $in: employeeIds }
      }
    }

    // Aggregate statistics
    const stats = await RewardPenalty.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          categories: { $addToSet: '$category' }
        }
      }
    ])

    // Category breakdown
    const categoryBreakdown = await RewardPenalty.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    // Top employees with rewards
    const topRewards = await RewardPenalty.aggregate([
      { $match: { ...matchFilter, type: 'reward' } },
      {
        $group: {
          _id: '$employee',
          totalRewards: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRewards: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employee_id: '$employee._id',
          full_name: '$employee.full_name',
          department: '$employee.department',
          totalRewards: 1,
          count: 1
        }
      }
    ])

    // Top employees with penalties
    const topPenalties = await RewardPenalty.aggregate([
      { $match: { ...matchFilter, type: 'penalty' } },
      {
        $group: {
          _id: '$employee',
          totalPenalties: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalPenalties: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $project: {
          employee_id: '$employee._id',
          full_name: '$employee.full_name',
          department: '$employee.department',
          totalPenalties: 1,
          count: 1
        }
      }
    ])

    // Pending approvals count
    const pendingCount = await RewardPenalty.countDocuments({
      month: targetMonth,
      year: targetYear,
      status: 'pending'
    })

    // Process stats
    const rewardStats = stats.find(s => s._id === 'reward') || { count: 0, totalAmount: 0 }
    const penaltyStats = stats.find(s => s._id === 'penalty') || { count: 0, totalAmount: 0 }

    return {
      status: true,
      data: {
        month: targetMonth,
        year: targetYear,
        summary: {
          totalRewards: rewardStats.totalAmount,
          rewardCount: rewardStats.count,
          totalPenalties: penaltyStats.totalAmount,
          penaltyCount: penaltyStats.count,
          netAmount: rewardStats.totalAmount - penaltyStats.totalAmount,
          pendingApprovals: pendingCount
        },
        categoryBreakdown: categoryBreakdown.map(c => ({
          type: c._id.type,
          category: c._id.category,
          count: c.count,
          totalAmount: c.totalAmount
        })),
        topRewards,
        topPenalties
      },
      message: 'Statistics loaded successfully'
    }
  }
  catch (error: any) {
    console.error('RewardPenalty Stats API Error:', error)
    return {
      status: false,
      message: error.message || 'Internal server error',
    }
  }
})
