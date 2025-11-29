import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TempRegistrationDocument = TempRegistration & Document;

@Schema({ timestamps: true })
export class TempRegistration {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  password: string; // Hashed password

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  radius: number; // in meters

  @Prop({ required: true })
  officeAddress: string;

  @Prop({ required: true })
  otp: string; // 6-digit OTP

  @Prop({ required: true })
  otpExpiry: Date; // 15 minutes from creation

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt?: Date;

  // Registration agreement acceptance
  @Prop({ default: false })
  agreementAccepted: boolean;

  @Prop()
  agreementVersion?: string; // Version of agreement accepted
}

export const TempRegistrationSchema =
  SchemaFactory.createForClass(TempRegistration);

// Index for cleanup job
TempRegistrationSchema.index({ createdAt: 1 });
TempRegistrationSchema.index({ otpExpiry: 1 });

