import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const data = z.object({
  _id: z.string(),
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  mail: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  balance: z.preprocess(
    (val) => (val !== "" ? Number(val) : 0),
    z.number().min(0, "Balance must be positive").optional()
  ),
});

export const form = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  mail: z.string().optional(),
  city: z.string().optional(),
  country: z.enum(["Vietnam", "Other"]).optional(), 
  balance: z.preprocess(
    (val) => (val !== "" ? Number(val) : 0),
    z.number().min(0, "Balance must be positive").optional()
  ),
});

export type Supplier = z.infer<typeof data>; 