import { BenefitModel } from '~/server/models/HRExtended'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all benefits
    if (method === 'GET') {
      const query = getQuery(event)
      const { employee, benefit_type, status } = query

      const filter: any = {}
      if (employee)
        filter.employee = employee
      if (benefit_type)
        filter.benefit_type = benefit_type
      if (status)
        filter.status = status

      const benefits = await BenefitModel.find(filter)
        .populate('employee', 'name position')
        .sort({ createdAt: -1 })

      return {
        status: true,
        data: benefits,
        total: benefits.length,
        message: 'Lấy danh sách phúc lợi thành công',
      }
    }

    // POST - Create new benefit
    if (method === 'POST') {
      const body = await readBody(event)

      const newBenefit = new BenefitModel(body)
      await newBenefit.save()

      return {
        status: true,
        data: newBenefit,
        message: 'Tạo phúc lợi thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Benefit API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
