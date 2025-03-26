import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/server/models/User';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event);
  const user = await User.findOne({ email: body.email });
  if (!user || !bcrypt.compareSync(body.password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id.toString() }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  return { token };
});