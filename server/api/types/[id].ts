import TypeMedicine from "@/server/models/Types";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await TypeMedicine.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }

  if (method === "DELETE") {
    await TypeMedicine.findByIdAndDelete(id);
    return { status: true, message: "Deleted" };
  }
});