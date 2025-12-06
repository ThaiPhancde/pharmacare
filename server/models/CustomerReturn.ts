import mongoose, { Schema, Document } from 'mongoose';

// Define interface for customer return item
export interface ICustomerReturnItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  batchId: string;
  expiryDate: Date;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Define interface for customer return
export interface ICustomerReturn extends Document {
  returnNumber: string;
  invoice: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  returnDate: Date;
  totalAmount: number;
  reason: string;
  status: string;
  items: ICustomerReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Define schema for customer return item
const CustomerReturnItemSchema = new Schema<ICustomerReturnItem>({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  batchId: { type: String, required: true },
  expiryDate: { type: Date },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true }
});

// Define schema for customer return
const CustomerReturnSchema = new Schema<ICustomerReturn>({
  returnNumber: { type: String, required: true, unique: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  returnDate: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  items: [CustomerReturnItemSchema]
}, { timestamps: true });

// Create model from schema
const CustomerReturn = mongoose.models.CustomerReturn || mongoose.model<ICustomerReturn>('CustomerReturn', CustomerReturnSchema);

export default CustomerReturn; 