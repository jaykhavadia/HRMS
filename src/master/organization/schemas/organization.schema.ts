import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  companyName: string;

  @Prop({ required: true })
  companyLocation: string;

  @Prop({ required: true, unique: true })
  companyEmail: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ required: true, unique: true })
  companyDomain: string;

  @Prop({ required: true, unique: true })
  clientId: string;

  @Prop({ required: true })
  clientName: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  subscriptionPlanId?: string;

  @Prop({ type: Object })
  officeLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    radius: number; // in meters
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
