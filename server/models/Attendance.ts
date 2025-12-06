import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  check_in?: Date;
  check_out?: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday';
  working_hours?: number;
  overtime_hours?: number;
  notes?: string;
  marked_by?: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    check_in: { type: Date },
    check_out: { type: Date },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'half-day', 'leave', 'holiday'], 
      default: 'present' 
    },
    working_hours: { type: Number, default: 0 },
    overtime_hours: { type: Number, default: 0 },
    notes: { type: String },
    marked_by: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Index for faster queries
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
