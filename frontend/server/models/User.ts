import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  email: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model<IUser>('User', UserSchema);

// Khởi tạo user admin nếu chưa có
(async () => {
  const adminExists = await User.findOne({ email: 'admin' });
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin', 10);
    await User.create({ email: 'admin', password: hashedPassword });
    console.log('Admin user created');
  } else {
    console.log('Founded One');
  }
})();

export default User;