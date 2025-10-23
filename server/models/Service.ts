import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  service_id: string;
  name: string;
  category: string;
  description?: string;
  duration?: number; // in minutes
  price: number;
  status: 'active' | 'inactive';
  requires_appointment: boolean;
  available_days?: string[]; // ['monday', 'tuesday', ...]
  available_time_slots?: string[]; // ['09:00-10:00', '10:00-11:00', ...]
  max_appointments_per_slot?: number;
  created_by?: mongoose.Types.ObjectId;
}

const ServiceSchema = new Schema<IService>(
  {
    service_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, default: 30 },
    price: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    requires_appointment: { type: Boolean, default: true },
    available_days: [{ type: String }],
    available_time_slots: [{ type: String }],
    max_appointments_per_slot: { type: Number, default: 5 },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
