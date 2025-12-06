import mongoose, { Schema, Document } from 'mongoose'

// Shift Model - Quản lý ca làm việc
export interface IShift extends Document {
  employee: mongoose.Types.ObjectId
  shift_date: Date
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night' | 'full-day'
  start_time: string // HH:mm format (scheduled)
  end_time: string // HH:mm format (scheduled)
  actual_start_time?: Date // Actual time when shift started
  actual_end_time?: Date // Actual time when shift ended
  opening_balance?: number // Cash balance at shift start
  closing_balance?: number // Cash balance at shift end
  hours_worked: number
  overtime_hours: number
  status: 'scheduled' | 'active' | 'completed' | 'absent' | 'cancelled'
  notes?: string
  created_by?: mongoose.Types.ObjectId
}

const ShiftSchema = new Schema<IShift>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    shift_date: { type: Date, required: true },
    shift_type: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'full-day'],
      required: true,
    },
    start_time: { type: String, required: true }, // Scheduled start time (HH:mm)
    end_time: { type: String, required: true }, // Scheduled end time (HH:mm)
    actual_start_time: { type: Date }, // Actual time when shift started
    actual_end_time: { type: Date }, // Actual time when shift ended
    opening_balance: { type: Number, default: 0 }, // Cash balance at shift start
    closing_balance: { type: Number, default: 0 }, // Cash balance at shift end
    hours_worked: { type: Number, default: 0 },
    overtime_hours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'absent', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

ShiftSchema.index({ employee: 1, shift_date: 1 })
ShiftSchema.index({ shift_date: 1, status: 1 })

// Benefits Model - Quản lý phúc lợi nhân viên
export interface IBenefit extends Document {
  employee: mongoose.Types.ObjectId
  benefit_type: 'insurance' | 'bonus' | 'allowance' | 'training' | 'welfare' | 'other'
  benefit_name: string
  description?: string
  amount: number
  effective_date: Date
  expiry_date?: Date
  status: 'active' | 'inactive' | 'expired'
  payment_frequency?: 'one-time' | 'monthly' | 'quarterly' | 'yearly'
  notes?: string
  created_by?: mongoose.Types.ObjectId
}

const BenefitSchema = new Schema<IBenefit>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    benefit_type: {
      type: String,
      enum: ['insurance', 'bonus', 'allowance', 'training', 'welfare', 'other'],
      required: true,
    },
    benefit_name: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, default: 0 },
    effective_date: { type: Date, required: true },
    expiry_date: { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
    },
    payment_frequency: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'yearly'],
      default: 'one-time',
    },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

BenefitSchema.index({ employee: 1, status: 1 })
BenefitSchema.index({ effective_date: 1, expiry_date: 1 })

export const ShiftModel = mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema)
export const BenefitModel = mongoose.models.Benefit || mongoose.model<IBenefit>('Benefit', BenefitSchema)

export { ShiftModel as default }
