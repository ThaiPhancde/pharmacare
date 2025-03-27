import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const data = z.object({
  id: z.string(),
  barcode: z.string().optional(),
  strength: z.string().optional(),
  boxSize: z.string().min(1, 'Box Size is required'),
  shelf: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  medicineType: z.string().optional(),
  supplier: z.string().min(1, 'Supplier is required'),
  tax: z.coerce.number().min(0).optional(),
  medicineName: z.string().min(1, 'Medicine Name is required'),
  genericName: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  details: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  image: z.any().optional(),
  supplierPrice: z.coerce.number().min(0, 'Supplier Price must be positive'),
  discount: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive']),
});

export const form = data.omit({ id: true }).extend({
  barcode: z.string().optional(), // Nếu cần khác biệt
});

export type Customer = z.infer<typeof data>;
