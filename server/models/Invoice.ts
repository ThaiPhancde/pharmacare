import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  medicine: mongoose.Types.ObjectId;
  batch_id: string;
  expiry_date: Date;
  quantity: number;
  price: number; // MRP
  vat: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  date: Date;
  customer?: mongoose.Types.ObjectId; // Optional reference to customer
  items: IInvoiceItem[];
  subtotal: number;
  vat_total: number;
  discount: number;
  grand_total: number;
  paid: number;
  due: number;
  payment_method: string;
  is_pos: boolean;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batch_id: { type: String, required: true },
    expiry_date: { type: Date, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Selling price (MRP)
    vat: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
  }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    date: { type: Date, default: Date.now },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    vat_total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grand_total: { type: Number, required: true },
    paid: { type: Number, required: true },
    due: { type: Number, default: 0 },
    payment_method: { type: String, default: 'cash' },
    is_pos: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema); 