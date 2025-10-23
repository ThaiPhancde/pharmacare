import { Service } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all services
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, category, search } = query

      const filter: any = {}
      
      if (status) filter.status = status
      if (category) filter.category = category
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { service_id: { $regex: search, $options: 'i' } }
        ]
      }

      const services = await Service.find(filter).sort({ createdAt: -1 })

      return {
        status: true,
        data: services,
        total: services.length,
        message: 'Lấy danh sách dịch vụ thành công',
      }
    }

    // POST - Create new service
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Generate service ID if not provided
      if (!body.service_id) {
        const count = await Service.countDocuments()
        body.service_id = `SRV${String(count + 1).padStart(5, '0')}`
      }

      const newService = new Service(body)
      await newService.save()

      return {
        status: true,
        data: newService,
        message: 'Thêm dịch vụ thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Service API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
