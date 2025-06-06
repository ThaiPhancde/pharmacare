import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'warehouse' | 'sales';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'warehouse', 'sales'],
    default: 'sales'
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const User = mongoose.model<IUser>('User', UserSchema);

// Khởi tạo user admin nếu chưa có
(async () => {
  try {
    // Kiểm tra và tạo user admin mới
    const adminExists = await User.findOne({ email: 'admin@pharmacare.com' });
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await User.create({ 
        name: 'Admin',
        email: 'admin@pharmacare.com', 
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created');
    } else {
      // Đảm bảo admin user có đầy đủ fields
      await User.updateOne(
        { email: 'admin@pharmacare.com' },
        { 
          $set: { 
            role: 'admin',
            isActive: true,
            name: adminExists.name || 'Admin'
          }
        }
      );
      console.log('Admin user updated');
    }
    
    // Update existing users to have default values
    await User.updateMany(
      { role: { $exists: false }, email: { $ne: 'admin@pharmacare.com' } },
      { 
        $set: { 
          role: 'sales',
          isActive: true,
          name: 'User'
        }
      }
    );
    
    console.log('User initialization completed');
  } catch (error) {
    console.error('Error initializing users:', error);
  }
})();

export default User;