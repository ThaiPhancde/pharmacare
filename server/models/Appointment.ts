import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  appointment_id: string;
  service: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  appointment_date: Date;
  time_slot: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  consultation_notes?: string;
  invoice?: mongoose.Types.ObjectId;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  created_by?: mongoose.Types.ObjectId;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointment_id: { type: String, required: true, unique: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true },
    customer_email: { type: String },
    appointment_date: { type: Date, required: true },
    time_slot: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'], 
      default: 'scheduled' 
    },
    notes: { type: String },
    consultation_notes: { type: String },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    payment_status: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Index for checking availability
AppointmentSchema.index({ service: 1, appointment_date: 1, time_slot: 1 });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
