import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId: string;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop()
  checkInTime?: Date;

  @Prop()
  checkOutTime?: Date;

  @Prop({
    type: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
  })
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop({
    type: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
  })
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop()
  checkInSelfie?: string;

  @Prop()
  checkOutSelfie?: string;

  @Prop({
    type: String,
    enum: ['checked-in', 'checked-out', 'absent'],
    default: 'checked-in',
  })
  status: string;

  @Prop()
  totalHours?: number;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ organizationId: 1 });
AttendanceSchema.index({ checkInTime: 1 });
