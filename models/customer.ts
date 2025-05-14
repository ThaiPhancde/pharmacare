import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const data = z.object({
  _id: z.string(),
  customer_id: z.string(),
  full_name: z.string().min(1, "Tên là bắt buộc"),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  medical_profile: z.object({
    chronic_conditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
  }).optional(),
  purchase_history: z.array(
    z.object({
      date: z.string(),
      items: z.array(
        z.object({
          medicine_name: z.string(),
          quantity: z.number(),
          unit: z.string(),
          with_prescription: z.boolean(),
        })
      ),
    })
  ).optional(),
  notes: z.string().optional(),
  created_at: z.date().optional(),
});

export const form = z.object({
  customer_id: z.string().optional(),
  full_name: z.string().min(1, "Tên là bắt buộc"),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  medical_profile: z.object({
    chronic_conditions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
  }).optional(),
  notes: z.string().optional(),
});

export type Customer = z.infer<typeof data>;
