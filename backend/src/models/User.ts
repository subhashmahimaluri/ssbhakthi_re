import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string;
  keycloakId: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    keycloakId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      sparse: true,
    },
    firstName: String,
    lastName: String,
    roles: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
UserSchema.index({ roles: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
