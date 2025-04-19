import Medicine from "@/server/models/Medicine";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "GET") {
    const item = await Medicine.findById(id)
      .populate("unit_id category_id type_id")
      .lean();
    return { data: item, status: true };
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await Medicine.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }

  if (method === "DELETE") {
    await Medicine.findByIdAndDelete(id);
    return { status: true };
  }
});
