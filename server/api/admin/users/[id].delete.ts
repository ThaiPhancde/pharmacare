import User from "@/server/models/User";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id');

  const user = await User.findById(userId);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "User not found" });
  }

  // Không cho phép xóa admin
  if (user.role === 'admin') {
    throw createError({ statusCode: 403, statusMessage: "Cannot delete admin user" });
  }

  await User.findByIdAndDelete(userId);

  return {
    data: null,
    status: true,
    message: "User deleted successfully"
  } as IResponse<any>;
}); 