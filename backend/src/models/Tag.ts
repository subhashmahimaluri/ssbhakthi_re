import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  id: string;
  name: string;
  lang: string; // Language code (en, te)
  slug: string;
  description?: string;
  color?: string; // Hex color for UI
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lang: {
      type: String,
      required: true,
      enum: ['en', 'te'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: String,
    color: {
      type: String,
      match: /^#[0-9a-fA-F]{6}$/,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
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

// Compound unique index for slug per language
TagSchema.index({ slug: 1, lang: 1 }, { unique: true });

// Other indexes
TagSchema.index({ name: 1, lang: 1 });
TagSchema.index({ lang: 1 });
TagSchema.index({ isActive: 1 });
TagSchema.index({ createdBy: 1 });
TagSchema.index({ createdAt: -1 });

export const Tag = mongoose.model<ITag>('Tag', TagSchema);
