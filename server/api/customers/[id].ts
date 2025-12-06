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
    try {
      const body = await readBody(event);
      console.log("PUT request body:", body);
      
      // Không kiểm tra full_name nữa
      // Đặt giá trị mặc định nếu không có
      if (!body.full_name) body.full_name = "";
      
      // Ensure nested objects are properly structured
      if (!body.contact_info) body.contact_info = {};
      if (!body.medical_profile) body.medical_profile = {
        chronic_conditions: [],
        allergies: [],
        current_medications: []
      };
      
      const updated =
        (await Customer.findByIdAndUpdate(id, body, { new: true })) ||
        createError({ statusCode: 404, statusMessage: "Not Found" });

      return {
        data: updated,
        status: true,
        message: "Update success",
      } satisfies IResponse<typeof updated>;
    } catch (error) {
      console.error("PUT customer error:", error);
      return {
        status: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
        error: error
      };
    }
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
