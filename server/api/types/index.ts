import TypeMedicine from "@/server/models/Types";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      TypeMedicine.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      TypeMedicine.countDocuments(),
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
    const created = await TypeMedicine.create(body);
    return { status: true, data: created };
  }
});
