import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const categorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  status: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;
