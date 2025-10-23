import { d as defineEventHandler, r as readBody, U as User, c as createError } from '../../../_/nitro.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'mongoose';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'zod';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const register = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const existingUser = await User.findOne({ email: body.email });
  if (existingUser) {
    throw createError({ statusCode: 400, statusMessage: "Email already in use" });
  }
  const hashedPassword = bcrypt.hashSync(body.password, 10);
  const newUser = new User({
    name: body.name,
    email: body.email,
    password: hashedPassword
  });
  await newUser.save();
  const token = jwt.sign({ id: newUser.id.toString() }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { data: token, status: true, message: "Registration success" };
});

export { register as default };
//# sourceMappingURL=register.mjs.map
