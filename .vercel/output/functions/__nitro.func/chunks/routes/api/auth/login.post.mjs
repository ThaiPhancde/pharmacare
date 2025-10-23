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

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const user = await User.findOne({ email: body.email });
  if (!user || !bcrypt.compareSync(body.password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }
  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: "Account is deactivated" });
  }
  const token = jwt.sign({
    id: user.id.toString(),
    email: user.email,
    role: user.role,
    name: user.name
  }, process.env.JWT_SECRET, { expiresIn: "24h" });
  return {
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    },
    status: true,
    message: "Login success"
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
