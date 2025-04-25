import Medicine from "@/server/models/Medicine";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    try {
      const query = getQuery(event);
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        Medicine.find()
          .skip(skip)
          .limit(limit)
          .populate("unit_id category_id type_id").lean(),
        Medicine.countDocuments(),
      ]);
      const dataRes = data.map((item) => ({
        ...item,
        unit: item.unit_id,
        category: item.category_id,
        type: item.type_id,
      }));

      return {
        data: dataRes,
        total,
        status: true,
        message: "Get data successfully",
      };
    } catch (error) {
      console.log("(❁´◡`❁)😒😒😒 ~ defineEventHandler ~ error:", error);
    }
  }

  if (method === "POST") {
    const body = await readBody(event);
    const created = await Medicine.create(body);
    return { status: true, data: created };
  }
});
