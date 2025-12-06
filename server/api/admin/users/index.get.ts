import User from "@/server/models/User";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const search = query.search as string || "";
  const role = query.role as string || "";

  const skip = (page - 1) * limit;

  // Build filter query
  const filter: any = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }
  if (role) {
    filter.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    data: users,
    total,
    page,
    limit,
    status: true,
    message: "Users fetched successfully"
  } as IResponse<any>;
}); 