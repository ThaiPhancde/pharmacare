import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  medicine: mongoose.Types.ObjectId;
  medicine_name?: string;
  batch_id: string;
  expiry_date: Date;
  quantity: number;
  price: number; // MRP
  vat: number;
  subtotal: number;
}

export interface IInvoice extends Document {
  _id: string | mongoose.Types.ObjectId;
  invoice_no?: string;
  date: Date;
  customer?: mongoose.Types.ObjectId; // Optional reference to customer
  shift?: mongoose.Types.ObjectId; // Reference to shift (for POS invoices)
  items: IInvoiceItem[];
  subtotal: number;
  vat_total: number;
  discount: number;
  voucher_code?: string;
  voucher_discount?: number;
  voucher?: mongoose.Types.ObjectId;
  grand_total: number;
  paid: number;
  due: number;
  payment_method: string;
  payment_status?: string;
  payment_details?: any;
  paypal_order_id?: string;
  paypal_payer_id?: string;
  is_pos: boolean;
  created_by?: mongoose.Types.ObjectId; // Employee who created the invoice
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicine_name: { type: String }, // Store medicine name directly
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
    _id: { type: Schema.Types.Mixed, required: true, auto: false },
    invoice_no: { type: String },
    date: { type: Date, default: Date.now },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' }, // Link to shift for POS invoices
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    vat_total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    voucher_code: { type: String },
    voucher_discount: { type: Number, default: 0 },
    voucher: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    grand_total: { type: Number, required: true },
    paid: { type: Number, required: true },
    due: { type: Number, default: 0 },
    payment_method: { type: String, default: 'cash' },
    payment_status: { type: String, default: 'pending' },
    payment_details: { type: Schema.Types.Mixed },
    paypal_order_id: { type: String },
    paypal_payer_id: { type: String },
    is_pos: { type: Boolean, default: false },
    created_by: { type: Schema.Types.ObjectId, ref: 'Employee' } // Employee who created the invoice
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema); 