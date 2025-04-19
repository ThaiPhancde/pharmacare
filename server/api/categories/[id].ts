import Category from "@/server/models/Category";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await Category.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }

  if (method === "DELETE") {
    await Category.findByIdAndDelete(id);
    return { status: true, message: "Deleted" };
  }
});