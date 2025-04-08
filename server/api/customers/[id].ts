import Customer from '@/server/models/Customer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method

  if (method === 'GET') {
    return await Customer.findById(id) || createError({ statusCode: 404, statusMessage: "Not Found" })
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    return await Customer.findByIdAndUpdate(id, body, { new: true }) || createError({ statusCode: 404, statusMessage: "Not Found" })
  }

  if (method === 'DELETE') {
    return await Customer.findByIdAndDelete(id) || createError({ statusCode: 404, statusMessage: "Not Found" })
  }
})