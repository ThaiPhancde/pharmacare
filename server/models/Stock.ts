import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
  medicine: mongoose.Types.ObjectId;
  batch_id: string;
  expiry_date: Date;
  box_pattern: string; // VD: '1 hộp = 10 vỉ'
  box_quantity: number;
  unit_quantity: number;
  purchase_price: number; //giá nhập
  mrp: number;  //giá bán
  vat?: number;
}

const StockSchema = new Schema<IStock>(
  {
    medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
    batch_id: { type: String, required: true },
    expiry_date: { type: Date, required: true },
    box_pattern: { type: String, required: true },
    box_quantity: { type: Number, default: 0 },
    unit_quantity: { type: Number, default: 0 },
    purchase_price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    vat: { type: Number }, // % VAT nếu có
  },
  { timestamps: true }
);

const Stock = mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema);

export default Stock;
