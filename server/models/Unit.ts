import mongoose, { Schema, Document } from "mongoose";

export interface IUnit extends Document {
  name: string;
  description?: string;
  status: boolean;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Unit =
  mongoose.models.Unit || mongoose.model<IUnit>("Unit", UnitSchema);

export default Unit;