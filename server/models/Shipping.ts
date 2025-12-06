import mongoose, { Schema, Document } from 'mongoose';

export interface IShipping extends Document {
  invoice: any;
  shipping_code?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  ward_code: string;
  district_id: number;
  province_id: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  service_id: number;
  status: string;
  note?: string;
  expected_delivery_date?: Date;
  shipping_fee: number;
  is_cod: boolean;
  payment_method: string;
  cod_amount: number;
  created_at: Date;
  updated_at: Date;
}

const ShippingSchema = new Schema<IShipping>(
  {
    invoice: { type: Schema.Types.Mixed, ref: 'Invoice', required: true },
    shipping_code: { type: String },
    recipient_name: { type: String, required: true },
    recipient_phone: { type: String, required: true },
    recipient_address: { type: String, required: true },
    ward_code: { type: String, required: true },
    district_id: { type: Number, required: true },
    province_id: { type: Number, required: true },
    weight: { type: Number, default: 500 }, // mặc định 500g
    length: { type: Number, default: 10 },
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 },
    service_id: { type: Number, default: 53320 }, // GHN Express
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
      default: 'pending'
    },
    note: { type: String, default: 'Thuốc - Xử lý cẩn thận' },
    expected_delivery_date: { type: Date },
    shipping_fee: { type: Number, default: 0 },
    is_cod: { type: Boolean, default: false },
    payment_method: { type: String, enum: ['prepaid', 'cod'], default: 'prepaid' },
    cod_amount: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Auto update updatedAt
ShippingSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.Shipping || mongoose.model<IShipping>('Shipping', ShippingSchema); 