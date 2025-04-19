import mongoose, { Schema, Document } from 'mongoose';

interface IMedicine extends Document {
  name: string;
  images: string;
  strength: string;
  generic: string;
  unit_id: { type: Schema.Types.ObjectId, ref: 'Unit' },
  category_id: { type: Schema.Types.ObjectId, ref: 'Category' },
  type_id: { type: Schema.Types.ObjectId, ref: 'Type' },
  supplier: string;
  supplier_price: number;
  bar_code: string;
  description?: string;
  price: number;
}

const MedicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  description: String,
  price: Number,
  images: String,
  strength: String,
  generic: String,
  unit_id: String,
  category_id: String,
  type_id: String,
  supplier: String,
  supplier_price: Number,
  bar_code: String
});

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);