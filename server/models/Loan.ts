import mongoose, { Schema, Document } from 'mongoose';

export interface ILoanPayment {
  payment_date: Date;
  amount: number;
  payment_method?: string;
  notes?: string;
  recorded_by?: mongoose.Types.ObjectId;
}

export interface ILoan extends Document {
  loan_id: string;
  employee?: mongoose.Types.ObjectId;
  person_name?: string; // For non-employee loans
  loan_type: 'employee' | 'personal' | 'business';
  amount: number;
  interest_rate?: number;
  loan_date: Date;
  due_date?: Date;
  payment_schedule?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'active' | 'paid' | 'overdue' | 'cancelled';
  payments: ILoanPayment[];
  description?: string;
  created_by?: mongoose.Types.ObjectId;
}

const LoanPaymentSchema = new Schema<ILoanPayment>({
  payment_date: { type: Date, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String },
  notes: { type: String },
  recorded_by: { type: Schema.Types.ObjectId, ref: 'User' }
});

const LoanSchema = new Schema<ILoan>(
  {
    loan_id: { type: String, required: true, unique: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    person_name: { type: String },
    loan_type: { type: String, enum: ['employee', 'personal', 'business'], required: true },
    amount: { type: Number, required: true },
    interest_rate: { type: Number, default: 0 },
    loan_date: { type: Date, required: true },
    due_date: { type: Date },
    payment_schedule: { type: String },
    total_amount: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    remaining_amount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'paid', 'overdue', 'cancelled'], default: 'active' },
    payments: [LoanPaymentSchema],
    description: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
