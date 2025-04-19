import { z } from "zod";

// We're keeping a simple non-relational schema here.
export const data = z.object({
  id: z.string(),
  barcode: z.string().optional(),
  strength: z.string().optional(),
  images: z.string().optional(),
  genericName: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().min(1, "Category is required"),
  medicineType: z.string().optional(),
  supplier: z.string().min(1, "Supplier is required"),
  supplierPrice: z.coerce.number().min(0, "Supplier Price must be positive"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  name: z.string().min(1, "Medicine Name is required"),
  image: z.any().optional(),
  discount: z.coerce.number().min(0).optional(),
  status: z.boolean(),
  // Assuming the references for unit_id, category_id, and type_id are ObjectIds in the database
  unit_id: z.string().optional(), // If unit_id is a string, replace with ObjectId reference if needed.
  category_id: z.string().optional(), // Same for category_id and type_id
  type_id: z.string().optional(),
});

export const form = data
  .omit({ id: true, unit_id: true, category_id: true, type_id: true })
  .extend({
    barcode: z.string().optional(),
    unit_id: z.string().optional(), // If unit_id is a string, replace with ObjectId reference if needed.
    category_id: z.string().optional(), // Same for category_id and type_id
    type_id: z.string().optional(),
    // unit: z.string().optional(), // If unit_id is a string, replace with ObjectId reference if needed.
    // category: z.string().optional(), // Same for category_id and type_id
    // type: z.string().optional(),
  });

export type Medicine = z.infer<typeof data>;
