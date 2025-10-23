import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  expense_id: string;
  date: Date;
  category: string;
  subcategory?: string;
  amount: number;
  payment_method: string;
  description?: string;
  vendor?: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approved_by?: mongoose.Types.ObjectId;
  created_by?: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expense_id: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    amount: { type: Number, required: true },
    payment_method: { type: String, required: true },
    description: { type: String },
    vendor: { type: String },
    receipt_url: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
