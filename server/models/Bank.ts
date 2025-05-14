import mongoose, { Schema, Document } from 'mongoose';

export interface IBank extends Document {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch?: string;
  qr_image?: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankSchema = new Schema<IBank>(
  {
    bank_name: { type: String, required: true },
    account_name: { type: String, required: true },
    account_number: { type: String, required: true },
    branch: { type: String },
    qr_image: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Bank = mongoose.models.Bank || mongoose.model<IBank>('Bank', BankSchema);

export default Bank; 