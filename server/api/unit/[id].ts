import Unit from "@/server/models/Unit";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await Unit.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }

  if (method === "DELETE") {
    await Unit.findByIdAndDelete(id);
    return { status: true, message: "Deleted" };
  }
});