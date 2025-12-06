import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/server/models/User';
import { IResponse } from '@/utils/api';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email: string; password: string }>(event);
  const user = await User.findOne({ email: body.email });
  if (!user || !bcrypt.compareSync(body.password, user.password)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' });
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Account is deactivated' });
  }
  
  const token = jwt.sign({ 
    id: user.id.toString(),
    email: user.email,
    role: user.role,
    name: user.name 
  }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
  
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
  } as IResponse<any>;
});