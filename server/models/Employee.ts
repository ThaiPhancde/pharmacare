import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  date_of_birth?: Date;
  date_of_joining: Date;
  address?: string;
  city?: string;
  country?: string;
  salary_basic: number;
  bank_account?: string;
  bank_name?: string;
  emergency_contact?: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  created_by?: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employee_id: { type: String, required: true, unique: true },
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    date_of_birth: { type: Date },
    date_of_joining: { type: Date, required: true },
    address: { type: String },
    city: { type: String },
    country: { type: String, default: 'Vietnam' },
    salary_basic: { type: Number, required: true },
    bank_account: { type: String },
    bank_name: { type: String },
    emergency_contact: { type: String },
    status: { type: String, enum: ['active', 'inactive', 'on-leave'], default: 'active' },
    avatar: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
