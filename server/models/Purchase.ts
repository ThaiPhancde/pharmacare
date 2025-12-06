import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseItem {
  medicine: mongoose.Types.ObjectId;
  batch_id: string;
  expiry_date: Date;
  box_pattern: string;
  box_quantity: number;
  unit_quantity: number;
  supplier_price: number;
  mrp: number;
  vat?: number;
}

export interface IPurchase extends Document {
  supplier: mongoose.Types.ObjectId;
  date: Date;
  invoice_no: string;
  payment_type: string;
  items: IPurchaseItem[];
  vat?: number;
  discount?: number;
  total: number;
  paid: number;
  due: number;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: "Medicine", required: true },
    batch_id: { type: String, required: true },
    expiry_date: { type: Date, required: true },
    box_pattern: { type: String, required: true },
    box_quantity: { type: Number, default: 0 },
    unit_quantity: { type: Number, default: 0 },
    supplier_price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    vat: { type: Number },
  },
  { _id: false } // không cần _id cho mỗi item con
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    date: { type: Date, default: Date.now },
    invoice_no: { type: String, required: true },
    payment_type: { type: String, required: true },
    items: { type: [PurchaseItemSchema], required: true },
    vat: { type: Number },
    discount: { type: Number },
    total: { type: Number, required: true },
    paid: { type: Number },
    due: { type: Number },
  },
  { timestamps: true }
);

const Purchase =
  mongoose.models.Purchase ||
  mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;
