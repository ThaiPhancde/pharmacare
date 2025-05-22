import mongoose, { Schema, Document } from 'mongoose';

// Define interface for supplier return item
export interface ISupplierReturnItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  batchId: string;
  expiryDate: Date;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Define interface for supplier return
export interface ISupplierReturn extends Document {
  returnNumber: string;
  purchase: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  returnDate: Date;
  totalAmount: number;
  reason: string;
  status: string;
  items: ISupplierReturnItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Define schema for supplier return item
const SupplierReturnItemSchema = new Schema<ISupplierReturnItem>({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  batchId: { type: String, required: true },
  expiryDate: { type: Date },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true }
});

// Define schema for supplier return
const SupplierReturnSchema = new Schema<ISupplierReturn>({
  returnNumber: { type: String, required: true, unique: true },
  purchase: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  returnDate: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  items: [SupplierReturnItemSchema]
}, { timestamps: true });

// Create model from schema
const SupplierReturn = mongoose.models.SupplierReturn || mongoose.model<ISupplierReturn>('SupplierReturn', SupplierReturnSchema);

export default SupplierReturn; 