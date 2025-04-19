import Customer from "@/server/models/Customer";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "GET") {
    const data =
      (await Customer.findById(id)) ||
      createError({ statusCode: 404, statusMessage: "Not Found" });
    return {
      data: data,
      status: true,
      message: "Get success",
    } satisfies IResponse<typeof data>;
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const updated =
      (await Customer.findByIdAndUpdate(id, body, { new: true })) ||
      createError({ statusCode: 404, statusMessage: "Not Found" });

    return {
      data: updated,
      status: true,
      message: "Update success",
    } satisfies IResponse<typeof updated>;
  }

  if (method === "DELETE") {
    const deleted =
      (await Customer.findByIdAndDelete(id)) ||
      createError({ statusCode: 404, statusMessage: "Not Found" });

    return {
      data: deleted,
      status: true,
      message: "Delete success",
    } satisfies IResponse<typeof deleted>;
  }
});
