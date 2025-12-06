import mongoose, { Schema, Document } from 'mongoose';

export interface IVoucher extends Document {
  voucher_code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  max_users?: number;
  start_date: Date;
  end_date: Date;
  applicable_to: 'all' | 'medicine' | 'service' | 'category';
  applicable_items?: mongoose.Types.ObjectId[]; // Medicine IDs, Service IDs, or Category IDs
  status: 'active' | 'inactive' | 'expired';
  created_by?: mongoose.Types.ObjectId;
}

export interface IVoucherUsage extends Document {
  voucher: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  discount_amount: number;
  used_date: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    voucher_code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String },
    discount_type: { type: String, enum: ['percentage', 'fixed'], required: true },
    discount_value: { type: Number, required: true },
    min_purchase_amount: { type: Number, default: 0 },
    max_discount_amount: { type: Number },
    usage_limit: { type: Number },
    usage_count: { type: Number, default: 0 },
    usage_limit_per_customer: { type: Number, default: 1 },
    max_users: { type: Number },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    applicable_to: { type: String, enum: ['all', 'medicine', 'service', 'category'], default: 'all' },
    applicable_items: [{ type: Schema.Types.ObjectId }],
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const VoucherUsageSchema = new Schema<IVoucherUsage>(
  {
    voucher: { type: Schema.Types.ObjectId, ref: 'Voucher', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    discount_amount: { type: Number, required: true },
    used_date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const VoucherModel = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);
export const VoucherUsageModel = mongoose.models.VoucherUsage || mongoose.model<IVoucherUsage>('VoucherUsage', VoucherUsageSchema);

export default VoucherModel;
