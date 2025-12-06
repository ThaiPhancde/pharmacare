import User from "@/server/models/User";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id');
  const body = await readBody(event);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      name: body.name,
      email: body.email,
      role: body.role,
      isActive: body.isActive
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  return {
    data: user,
    status: true,
    message: "User updated successfully"
  } as IResponse<any>;
}); 