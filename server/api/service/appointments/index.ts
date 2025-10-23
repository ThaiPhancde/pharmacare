import { Appointment } from '~/server/models'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all appointments
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, service, date, search } = query

      const filter: any = {}
      
      if (status) filter.status = status
      if (service) filter.service = service
      if (date) {
        const startDate = new Date(date as string)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(date as string)
        endDate.setHours(23, 59, 59, 999)
        filter.appointment_date = { $gte: startDate, $lte: endDate }
      }
      if (search) {
        filter.$or = [
          { customer_name: { $regex: search, $options: 'i' } },
          { customer_phone: { $regex: search, $options: 'i' } },
          { appointment_id: { $regex: search, $options: 'i' } }
        ]
      }

      const appointments = await Appointment.find(filter)
        .populate('service')
        .populate('customer')
        .sort({ appointment_date: -1 })

      return {
        status: true,
        data: appointments,
        total: appointments.length,
        message: 'Lấy danh sách lịch hẹn thành công',
      }
    }

    // POST - Create new appointment
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Generate appointment ID if not provided
      if (!body.appointment_id) {
        const count = await Appointment.countDocuments()
        body.appointment_id = `APT${String(count + 1).padStart(6, '0')}`
      }

      // Check appointment availability
      const existingAppointments = await Appointment.countDocuments({
        service: body.service,
        appointment_date: body.appointment_date,
        time_slot: body.time_slot,
        status: { $nin: ['cancelled', 'no-show'] }
      })

      // Get service to check max appointments
      const { Service } = await import('~/server/models')
      const service = await Service.findById(body.service)
      
      if (service && service.max_appointments_per_slot && 
          existingAppointments >= service.max_appointments_per_slot) {
        return {
          status: false,
          message: 'Khung giờ này đã đầy. Vui lòng chọn khung giờ khác!',
        }
      }

      const newAppointment = new Appointment(body)
      await newAppointment.save()

      return {
        status: true,
        data: newAppointment,
        message: 'Đặt lịch hẹn thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Appointment API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
