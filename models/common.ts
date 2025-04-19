import { z } from "zod";

export const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.boolean().optional(),
});

export type BaseModel = z.infer<typeof baseSchema>;
