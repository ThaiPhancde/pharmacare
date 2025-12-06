import mongoose, { Schema, Document } from "mongoose";

export interface ITypeMedicine extends Document {
  name: string;
  description?: string;
  status: boolean;
}

const TypeMedicineSchema = new Schema<ITypeMedicine>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default mongoose.models.TypeMedicine || mongoose.model<ITypeMedicine>("TypeMedicine", TypeMedicineSchema);;