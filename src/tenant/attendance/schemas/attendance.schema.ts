import { Schema } from 'mongoose';

export const AttendanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    checkInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    checkOutLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    checkInSelfie: { type: String },
    checkOutSelfie: { type: String },
    status: {
      type: String,
      enum: ['checked-in', 'checked-out', 'absent'],
      default: 'checked-in',
    },
    totalHours: { type: Number },
  },
  { timestamps: true },
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ checkInTime: 1 });
