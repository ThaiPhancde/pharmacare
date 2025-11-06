import mongoose, { Schema, Document } from 'mongoose'

export interface ICampaign extends Document {
  name: string
  description?: string
  campaign_type: 'seasonal' | 'loyalty' | 'product' | 'clearance' | 'other'
  start_date: Date
  end_date: Date
  status: 'active' | 'inactive' | 'completed'
  total_vouchers: number
  used_vouchers: number
  total_revenue: number
  total_discount: number
  created_by?: mongoose.Types.ObjectId
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true },
    description: { type: String },
    campaign_type: {
      type: String,
      enum: ['seasonal', 'loyalty', 'product', 'clearance', 'other'],
      default: 'other',
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
    total_vouchers: { type: Number, default: 0 },
    used_vouchers: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    total_discount: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

// Index để tối ưu truy vấn
CampaignSchema.index({ status: 1, start_date: 1, end_date: 1 })

export const CampaignModel = mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema)

export default CampaignModel
