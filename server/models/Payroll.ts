import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollBenefit {
  name: string;
  amount: number;
  type: 'allowance' | 'bonus' | 'incentive';
}

export interface IPayrollDeduction {
  name: string;
  amount: number;
  type: 'tax' | 'insurance' | 'loan' | 'other';
}

export interface IPayroll extends Document {
  employee: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  basic_salary: number;
  benefits: IPayrollBenefit[];
  deductions: IPayrollDeduction[];
  working_days: number;
  present_days: number;
  overtime_hours: number;
  overtime_pay: number;
  gross_salary: number;
  net_salary: number;
  payment_date?: Date;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  created_by?: mongoose.Types.ObjectId;
}

const PayrollBenefitSchema = new Schema<IPayrollBenefit>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['allowance', 'bonus', 'incentive'], required: true }
});

const PayrollDeductionSchema = new Schema<IPayrollDeduction>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['tax', 'insurance', 'loan', 'other'], required: true }
});

const PayrollSchema = new Schema<IPayroll>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    basic_salary: { type: Number, required: true },
    benefits: [PayrollBenefitSchema],
    deductions: [PayrollDeductionSchema],
    working_days: { type: Number, required: true },
    present_days: { type: Number, required: true },
    overtime_hours: { type: Number, default: 0 },
    overtime_pay: { type: Number, default: 0 },
    gross_salary: { type: Number, required: true },
    net_salary: { type: Number, required: true },
    payment_date: { type: Date },
    payment_method: { type: String, default: 'bank_transfer' },
    payment_status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Index for unique payroll per employee per month
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', PayrollSchema);
