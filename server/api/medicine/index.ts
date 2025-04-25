import Unit  from "@/server/models/Unit"
import TypeMedicine  from "@/server/models/Types"
import Category  from "@/server/models/Category"
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
          .populate("unit_id category_id type_id"),
        Medicine.countDocuments(),
      ]);
      
  
      return {
        data,
        total,
        status: true,
        message: "Get data successfully",
      };
    } catch (error) {
      console.log("(❁´◡`❁)😒😒😒 ~ defineEventHandler ~ error:", error)
      
    }
  }

  if (method === "POST") {
    const body = await readBody(event);
    const created = await Medicine.create(body);
    return { status: true, data: created };
  }
});
