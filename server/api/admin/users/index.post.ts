import bcrypt from "bcryptjs";
import User from "@/server/models/User";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'warehouse' | 'sales';
    isActive?: boolean;
    phone?: string;
  }>(event);

  // Validate required fields
  if (!body.name || !body.email || !body.password || !body.role) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name, email, password and role are required"
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid email format"
    });
  }

  // Validate password length
  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must be at least 6 characters"
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email already in use"
    });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(body.password, 10);

  // Create new user
  const newUser = await User.create({
    name: body.name,
    email: body.email,
    password: hashedPassword,
    role: body.role,
    isActive: body.isActive !== undefined ? body.isActive : true,
    phone: body.phone || ''
  });

  // Return user without password
  const userResponse = await User.findById(newUser._id).select("-password");

  return {
    data: userResponse,
    status: true,
    message: "User created successfully"
  } as IResponse<any>;
});
