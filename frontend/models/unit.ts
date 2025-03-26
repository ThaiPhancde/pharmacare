import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const unit = z.object({
  id: z.string(),
  name: z.string(),
  status: z.boolean(),
});

export const form = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.boolean().default(false), // Set default để tránh undefined
});


export type Unit = z.infer<typeof unit>;

