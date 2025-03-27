import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "@/server/models/User";
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; email: string; password: string }>(event);

  // Kiểm tra email đã tồn tại chưa
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) {
    throw createError({ statusCode: 400, statusMessage: "Email already in use" });
  }

  // Băm mật khẩu
  const hashedPassword = bcrypt.hashSync(body.password, 10);

  // Tạo user mới
  const newUser = new User({
    name: body.name,
    email: body.email,
    password: hashedPassword,
  });
  await newUser.save();

  // Tạo token JWT
  const token = jwt.sign({ id: newUser.id.toString() }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

  return { data: token, status: true, message: "Registration success" } as IResponse<string>;
});