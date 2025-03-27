import mongoose, { Schema, Document } from 'mongoose';

interface IMedicine extends Document {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

const MedicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  description: String,
  price: Number,
  stock: Number
});

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);