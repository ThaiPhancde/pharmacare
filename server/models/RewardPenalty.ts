import mongoose, { Schema, Document } from 'mongoose'

// Reward/Penalty Types based on industry standards
export type RewardType = 
  | 'performance_bonus'      // Thưởng hiệu suất
  | 'attendance_bonus'       // Thưởng chuyên cần
  | 'project_completion'     // Thưởng hoàn thành dự án
  | 'innovation_award'       // Thưởng sáng kiến
  | 'sales_commission'       // Hoa hồng bán hàng
  | 'referral_bonus'         // Thưởng giới thiệu
  | 'annual_bonus'           // Thưởng năm
  | 'holiday_bonus'          // Thưởng lễ tết
  | 'recognition_award'      // Giải thưởng ghi nhận
  | 'overtime_bonus'         // Thưởng làm thêm giờ
  | 'other_reward'           // Thưởng khác

export type PenaltyType = 
  | 'late_arrival'           // Đi muộn
  | 'early_leave'            // Về sớm
  | 'absent_without_leave'   // Nghỉ không phép
  | 'policy_violation'       // Vi phạm quy định
  | 'misconduct'             // Vi phạm kỷ luật
  | 'performance_issue'      // Vấn đề hiệu suất
  | 'dress_code'             // Vi phạm trang phục
  | 'safety_violation'       // Vi phạm an toàn
  | 'property_damage'        // Làm hỏng tài sản
  | 'confidentiality_breach' // Vi phạm bảo mật
  | 'other_penalty'          // Phạt khác

export interface IRewardPenalty extends Document {
  employee: mongoose.Types.ObjectId
  type: 'reward' | 'penalty'
  category: RewardType | PenaltyType
  title: string
  description?: string
  amount: number
  effective_date: Date
  month: number // Month this applies to (1-12)
  year: number // Year this applies to
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  approved_by?: mongoose.Types.ObjectId
  approved_date?: Date
  rejection_reason?: string
  evidence_url?: string // URL to evidence document/image
  notes?: string
  created_by?: mongoose.Types.ObjectId
}

const RewardPenaltySchema = new Schema<IRewardPenalty>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: { 
      type: String, 
      enum: ['reward', 'penalty'], 
      required: true 
    },
    category: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v: string) {
          const rewardTypes = [
            'performance_bonus', 'attendance_bonus', 'project_completion',
            'innovation_award', 'sales_commission', 'referral_bonus',
            'annual_bonus', 'holiday_bonus', 'recognition_award',
            'overtime_bonus', 'other_reward'
          ]
          const penaltyTypes = [
            'late_arrival', 'early_leave', 'absent_without_leave',
            'policy_violation', 'misconduct', 'performance_issue',
            'dress_code', 'safety_violation', 'property_damage',
            'confidentiality_breach', 'other_penalty'
          ]
          return rewardTypes.includes(v) || penaltyTypes.includes(v)
        },
        message: 'Invalid category type'
      }
    },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 },
    effective_date: { type: Date, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'applied'], 
      default: 'pending' 
    },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_date: { type: Date },
    rejection_reason: { type: String },
    evidence_url: { type: String },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

// Indexes for efficient queries
RewardPenaltySchema.index({ employee: 1, type: 1 })
RewardPenaltySchema.index({ employee: 1, month: 1, year: 1 })
RewardPenaltySchema.index({ month: 1, year: 1, status: 1 })
RewardPenaltySchema.index({ effective_date: 1 })
RewardPenaltySchema.index({ status: 1 })

// Virtual for getting formatted category name
RewardPenaltySchema.virtual('category_label').get(function() {
  const labels: Record<string, string> = {
    // Reward types
    'performance_bonus': 'Performance Bonus',
    'attendance_bonus': 'Attendance Bonus',
    'project_completion': 'Project Completion Bonus',
    'innovation_award': 'Innovation Award',
    'sales_commission': 'Sales Commission',
    'referral_bonus': 'Referral Bonus',
    'annual_bonus': 'Annual Bonus',
    'holiday_bonus': 'Holiday Bonus',
    'recognition_award': 'Recognition Award',
    'overtime_bonus': 'Overtime Bonus',
    'other_reward': 'Other Reward',
    // Penalty types
    'late_arrival': 'Late Arrival',
    'early_leave': 'Early Leave',
    'absent_without_leave': 'Absent Without Leave',
    'policy_violation': 'Policy Violation',
    'misconduct': 'Misconduct',
    'performance_issue': 'Performance Issue',
    'dress_code': 'Dress Code Violation',
    'safety_violation': 'Safety Violation',
    'property_damage': 'Property Damage',
    'confidentiality_breach': 'Confidentiality Breach',
    'other_penalty': 'Other Penalty'
  }
  return labels[this.category] || this.category
})

RewardPenaltySchema.set('toJSON', { virtuals: true })
RewardPenaltySchema.set('toObject', { virtuals: true })

export default mongoose.models.RewardPenalty || mongoose.model<IRewardPenalty>('RewardPenalty', RewardPenaltySchema)
