import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const category = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: z.boolean(),
});

export const form = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.boolean().optional(),
});


export type Category = z.infer<typeof category>;
