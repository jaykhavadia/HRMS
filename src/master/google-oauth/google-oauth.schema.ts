import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoogleOAuthDocument = GoogleOAuth & Document;

@Schema({ timestamps: true })
export class GoogleOAuth {
  @Prop({ required: true, unique: true, default: 'default' })
  name: string; // Identifier for this OAuth config (default: 'default')

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  clientSecret: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  accessToken?: string; // Current access token (refreshed automatically)

  @Prop()
  accessTokenExpiry?: Date; // When the access token expires

  @Prop({ default: true })
  isActive: boolean; // Whether this OAuth config is active

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GoogleOAuthSchema = SchemaFactory.createForClass(GoogleOAuth);
