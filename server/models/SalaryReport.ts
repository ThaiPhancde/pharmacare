import mongoose, { Schema, Document } from 'mongoose'

// Interface for individual salary component
export interface ISalaryComponent {
  name: string
  amount: number
  type: 'earning' | 'deduction'
  category: string
}

// Interface for salary report
export interface ISalaryReport extends Document {
  employee: mongoose.Types.ObjectId
  month: number // 1-12
  year: number
  
  // Basic salary info
  basic_salary: number
  
  // Working time
  working_days: number // Total working days in month
  present_days: number // Days worked
  absent_days: number
  late_days: number
  leave_days: number
  
  // Overtime
  overtime_hours: number
  overtime_rate: number // Rate multiplier (e.g., 1.5, 2.0)
  overtime_pay: number
  
  // Rewards
  total_rewards: number
  reward_details: Array<{
    reward_id: mongoose.Types.ObjectId
    title: string
    category: string
    amount: number
  }>
  
  // Penalties
  total_penalties: number
  penalty_details: Array<{
    penalty_id: mongoose.Types.ObjectId
    title: string
    category: string
    amount: number
  }>
  
  // Allowances
  allowances: ISalaryComponent[]
  total_allowances: number
  
  // Deductions
  deductions: ISalaryComponent[]
  total_deductions: number
  
  // Insurance & Tax
  social_insurance: number // BHXH
  health_insurance: number // BHYT
  unemployment_insurance: number // BHTN
  personal_income_tax: number // TNCN
  
  // Calculated totals
  gross_salary: number
  net_salary: number
  
  // Payment info
  payment_date?: Date
  payment_method: 'bank_transfer' | 'cash' | 'check'
  payment_reference?: string
  payment_status: 'pending' | 'processing' | 'paid' | 'cancelled'
  
  // Status
  status: 'draft' | 'calculated' | 'approved' | 'finalized'
  calculated_at?: Date
  approved_by?: mongoose.Types.ObjectId
  approved_at?: Date
  finalized_by?: mongoose.Types.ObjectId
  finalized_at?: Date
  
  notes?: string
  created_by?: mongoose.Types.ObjectId
}

const SalaryComponentSchema = new Schema<ISalaryComponent>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['earning', 'deduction'], required: true },
  category: { type: String, required: true }
}, { _id: false })

const RewardDetailSchema = new Schema({
  reward_id: { type: Schema.Types.ObjectId, ref: 'RewardPenalty' },
  title: { type: String },
  category: { type: String },
  amount: { type: Number }
}, { _id: false })

const PenaltyDetailSchema = new Schema({
  penalty_id: { type: Schema.Types.ObjectId, ref: 'RewardPenalty' },
  title: { type: String },
  category: { type: String },
  amount: { type: Number }
}, { _id: false })

const SalaryReportSchema = new Schema<ISalaryReport>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    
    // Basic salary
    basic_salary: { type: Number, required: true },
    
    // Working time
    working_days: { type: Number, default: 22 },
    present_days: { type: Number, default: 0 },
    absent_days: { type: Number, default: 0 },
    late_days: { type: Number, default: 0 },
    leave_days: { type: Number, default: 0 },
    
    // Overtime
    overtime_hours: { type: Number, default: 0 },
    overtime_rate: { type: Number, default: 1.5 },
    overtime_pay: { type: Number, default: 0 },
    
    // Rewards
    total_rewards: { type: Number, default: 0 },
    reward_details: [RewardDetailSchema],
    
    // Penalties
    total_penalties: { type: Number, default: 0 },
    penalty_details: [PenaltyDetailSchema],
    
    // Allowances
    allowances: [SalaryComponentSchema],
    total_allowances: { type: Number, default: 0 },
    
    // Deductions
    deductions: [SalaryComponentSchema],
    total_deductions: { type: Number, default: 0 },
    
    // Insurance & Tax (Vietnam standard rates)
    social_insurance: { type: Number, default: 0 }, // 8% employee
    health_insurance: { type: Number, default: 0 }, // 1.5% employee
    unemployment_insurance: { type: Number, default: 0 }, // 1% employee
    personal_income_tax: { type: Number, default: 0 },
    
    // Calculated totals
    gross_salary: { type: Number, default: 0 },
    net_salary: { type: Number, default: 0 },
    
    // Payment info
    payment_date: { type: Date },
    payment_method: { 
      type: String, 
      enum: ['bank_transfer', 'cash', 'check'], 
      default: 'bank_transfer' 
    },
    payment_reference: { type: String },
    payment_status: { 
      type: String, 
      enum: ['pending', 'processing', 'paid', 'cancelled'], 
      default: 'pending' 
    },
    
    // Status
    status: { 
      type: String, 
      enum: ['draft', 'calculated', 'approved', 'finalized'], 
      default: 'draft' 
    },
    calculated_at: { type: Date },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
    finalized_by: { type: Schema.Types.ObjectId, ref: 'User' },
    finalized_at: { type: Date },
    
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

// Unique index for one report per employee per month
SalaryReportSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true })
SalaryReportSchema.index({ month: 1, year: 1, status: 1 })
SalaryReportSchema.index({ payment_status: 1 })

// Pre-save hook to calculate totals
SalaryReportSchema.pre('save', function(next) {
  // Calculate total allowances
  this.total_allowances = this.allowances.reduce((sum, a) => sum + a.amount, 0)
  
  // Calculate total deductions (excluding insurance and tax)
  this.total_deductions = this.deductions.reduce((sum, d) => sum + d.amount, 0)
  
  // Calculate overtime pay (basic salary / working days / 8 hours * overtime_hours * overtime_rate)
  const hourlyRate = this.basic_salary / this.working_days / 8
  this.overtime_pay = hourlyRate * this.overtime_hours * this.overtime_rate
  
  // Calculate gross salary
  this.gross_salary = this.basic_salary + this.total_allowances + this.overtime_pay + this.total_rewards
  
  // Calculate net salary
  const totalDeductions = this.total_penalties + 
                          this.total_deductions + 
                          this.social_insurance + 
                          this.health_insurance + 
                          this.unemployment_insurance + 
                          this.personal_income_tax
  
  this.net_salary = this.gross_salary - totalDeductions
  
  next()
})

export default mongoose.models.SalaryReport || mongoose.model<ISalaryReport>('SalaryReport', SalaryReportSchema)
