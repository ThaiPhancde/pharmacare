import mongoose, { Schema, Document } from "mongoose";

// Interface for Medicine model
interface IMedicine extends Document {
  name: string;
  image: string;
  strength: string;
  generic: string;
  unit_id: { type: Schema.Types.ObjectId; ref: "Unit" };
  category_id: { type: Schema.Types.ObjectId; ref: "Category" };
  type_id: { type: Schema.Types.ObjectId; ref: "TypeMedicine" };
  supplier: string;
  supplier_price: number;
  bar_code: string;
  description?: string;
  price: number;
}

const MedicineSchema = new Schema<IMedicine>({
  name: { type: String, required: true },
  description: { type: String, default: 'No description available' },
  price: { type: Number, required: true },
  image: String,
  strength: String,
  generic: String,
  unit_id: { type: Schema.Types.ObjectId, ref: "Unit" },
  category_id: { type: Schema.Types.ObjectId, ref: "Category" },
  type_id: { type: Schema.Types.ObjectId, ref: "TypeMedicine" },
  supplier: String,
  supplier_price: { type: Number, required: true },
  bar_code: String,
});

// Index trên các trường unit_id và category_id
MedicineSchema.index({ unit_id: 1, category_id: 1 });

// Tạo text index cho name và description
MedicineSchema.index({ name: "text", description: "text" });

MedicineSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.unit = ret.unit_id.toString();
    ret.category = ret.category_id.toString();
    ret.type = ret.type_id.toString();

    delete ret.unit_id;
    delete ret.category_id;
    delete ret.type_id;

    return ret;
  },
});

// Ensure the model is created once
export default mongoose.models.Medicine ||
  mongoose.model<IMedicine>("Medicine", MedicineSchema);
