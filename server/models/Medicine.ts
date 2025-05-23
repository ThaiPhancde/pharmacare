import mongoose, { Schema, Document } from "mongoose";
// Import các schema phụ (Unit, Category, TypeMedicine)

// Interface for Medicine model
interface IMedicine extends Document {
  name: string;
  image: string;
  strength: string;
  generic: string;
  unit_id: { type: Schema.Types.ObjectId; ref: "Unit" }; // Reference to Unit collection
  category_id: { type: Schema.Types.ObjectId; ref: "Category" }; // Reference to Category collection
  type_id: { type: Schema.Types.ObjectId; ref: "TypeMedicine" }; // Reference to Type collection
  supplier: string;
  supplier_price: number;
  bar_code: string;
  description?: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
  stocks?: any[]; // Trường ảo để chứa stocks
}

// Medicine Schema definition
const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    image: String,
    strength: String,
    generic: String,
    unit_id: { type: Schema.Types.ObjectId, ref: "Unit" }, // Corrected type
    category_id: { type: Schema.Types.ObjectId, ref: "Category" }, // Corrected type
    type_id: { type: Schema.Types.ObjectId, ref: "TypeMedicine" }, // Corrected type
    supplier: String,
    supplier_price: Number,
    bar_code: String,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Định nghĩa trường ảo stocks
MedicineSchema.virtual('stocks', {
  ref: 'Stock',
  localField: '_id',
  foreignField: 'medicine'
});

MedicineSchema.set("toJSON", {
  transform: (doc, ret) => {
    // Đổi tên trường trả về
    ret.unit = ret.unit_id;
    ret.category = ret.category_id;
    ret.type = ret.type_id;

    // Xóa các trường _id cũ và các trường không cần thiết
    delete ret.unit_id;
    delete ret.category_id;
    delete ret.type_id;

    return ret;
  },
  virtuals: true
});

// Create and export the model
export default mongoose.models.Medicine ||
  mongoose.model<IMedicine>("Medicine", MedicineSchema);
