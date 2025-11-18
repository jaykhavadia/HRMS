import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNumber: { type: String },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    isPasswordSet: { type: Boolean, default: false },
    passwordSetupToken: { type: String },
    passwordSetupTokenExpiry: { type: Date },
  },
  { timestamps: true },
);

// Index is already created by unique: true above, so we don't need this
// UserSchema.index({ email: 1 }, { unique: true });
