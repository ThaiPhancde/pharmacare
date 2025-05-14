import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

//
// ZOD SCHEMA — dùng cho validate form, FE, type inference
//
const baseCustomerSchema = {
  customer_id: z.string(),
  full_name: z.string().optional(),
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
};

export const customerFormSchema = z.object(baseCustomerSchema);
export const customerDataSchema = z.object({
  id: z.string(),
  ...baseCustomerSchema,
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
  created_at: z.date().optional(),
});

export type Customer = z.infer<typeof customerDataSchema>;

//
// MONGOOSE SCHEMA — dùng cho database
//
export interface ICustomer extends Document {
  customer_id: string;
  full_name: string;
  contact_info?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  medical_profile?: {
    chronic_conditions?: string[];
    allergies?: string[];
    current_medications?: string[];
  };
  purchase_history?: Array<{
    date: string;
    items: Array<{
      medicine_name: string;
      quantity: number;
      unit: string;
      with_prescription: boolean;
    }>;
  }>;
  notes?: string;
  created_at: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customer_id: { type: String, required: true },
    full_name: { type: String, default: "" },
    contact_info: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    medical_profile: {
      chronic_conditions: [{ type: String }],
      allergies: [{ type: String }],
      current_medications: [{ type: String }],
    },
    purchase_history: [
      {
        date: { type: String },
        items: [
          {
            medicine_name: { type: String },
            quantity: { type: Number },
            unit: { type: String },
            with_prescription: { type: Boolean, default: false },
          },
        ],
      },
    ],
    notes: { type: String, default: "" },
    created_at: { type: Date, default: () => new Date() },
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
