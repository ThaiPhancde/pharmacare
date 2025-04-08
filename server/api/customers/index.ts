import Customer from "@/server/models/Customer";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Customer.find().skip(skip).limit(limit),
      Customer.countDocuments(),
    ]);

    return {
      data,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === "POST") {
    const body = await readBody(event);
    if (!body.name)
      throw createError({ statusCode: 400, statusMessage: "Name is required" });
    const dataResponse = await Customer.create(body);
    return {
      data: dataResponse, // Sử dụng interface thay vì `Customer`
      status: true,
      message: "Created success",
    } satisfies IResponse<typeof dataResponse>;
  }
});
