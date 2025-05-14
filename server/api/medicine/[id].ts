import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";

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
    const medicine = await Medicine.findById(id);
    if (!medicine) return { status: false, message: "Medicine not found" };
  
    await Promise.all([
      Medicine.findByIdAndDelete(id),
      Stock.deleteMany({ batch_id: medicine.bar_code }),
    ]);
  
    return { status: true };
  }
});
