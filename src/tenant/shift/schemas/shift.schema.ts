import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema({ timestamps: true })
export class Shift {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startTime: string; // Format: HH:mm (24-hour, e.g., "09:00")

  @Prop({ required: true })
  endTime: string; // Format: HH:mm (24-hour, e.g., "17:00")

  @Prop({ required: true })
  lateTime: string; // Format: HH:mm (24-hour, e.g., "09:30")

  @Prop({
    type: [Number],
    required: true,
    validate: {
      validator: (v: number[]) => v.length === 7,
      message: 'Days array must have exactly 7 elements (Sunday to Saturday)',
    },
  })
  days: number[]; // [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
  // 0 = off day, 1 = working day

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  })
  organizationId: string; // Organization-specific shifts
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

// Index for organization queries
ShiftSchema.index({ organizationId: 1 });
ShiftSchema.index({ organizationId: 1, name: 1 }, { unique: true }); // Unique shift name per organization
