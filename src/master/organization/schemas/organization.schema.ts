import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  companyName: string;

  @Prop({ required: true })
  officeAddress: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true })
  radius: number; // in meters

  @Prop({ default: true })
  isActive: boolean;

  // Work hours
  @Prop({ default: '09:00' })
  workStartTime: string; // Format: HH:mm (24-hour)

  @Prop({ default: '18:00' })
  workEndTime: string; // Format: HH:mm (24-hour)

  // Weekly off days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  @Prop({ type: [Number], default: [] })
  weeklyOffDays: number[];

  // Registration agreement acceptance record
  @Prop({ default: false })
  agreementAccepted: boolean;

  @Prop()
  agreementAcceptedAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
