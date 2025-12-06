import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string; // Hashed password (optional - set via password setup for employees)

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  mobileNumber?: string;

  @Prop({
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee',
    required: true,
  })
  role: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Prop({ type: 'ObjectId', ref: 'Organization', required: true })
  organizationId: string;

  @Prop({ unique: true, sparse: true })
  employeeId?: string; // Auto-generated employee ID (e.g., EMP001, EMP002)

  @Prop()
  passwordSetupToken?: string;

  @Prop()
  passwordSetupTokenExpiry?: Date;

  @Prop({ required: true, default: false })
  remote: boolean; // If true, location validation is skipped for check-in/check-out

  @Prop({ type: 'ObjectId', ref: 'Shift' })
  shiftId?: string; // Optional - if not assigned, default shift is used
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for organization queries
UserSchema.index({ organizationId: 1 });
UserSchema.index({ email: 1 }, { unique: true });
