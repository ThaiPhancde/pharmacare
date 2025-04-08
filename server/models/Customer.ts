import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

//
// ZOD SCHEMA — dùng cho validate form, FE, type inference
//
const baseCustomerSchema = {
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  mail: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  balance: z.preprocess(
    (val) => (val !== "" ? Number(val) : 0),
    z.number().min(0, "Balance must be positive").optional()
  ),
};

export const customerFormSchema = z.object(baseCustomerSchema);
export const customerDataSchema = z.object({
  id: z.string(),
  ...baseCustomerSchema,
});

export type Customer = z.infer<typeof customerDataSchema>;

//
// MONGOOSE SCHEMA — dùng cho database
//
export interface ICustomer extends Document {
  name: string;
  address?: string;
  phone?: string;
  mail?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    mail: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zip: { type: String, default: "" },
    country: { type: String, default: "" },
    balance: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Auto update updatedAt
CustomerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const CustomerModel =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);

export default CustomerModel;
