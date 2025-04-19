import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  status: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;