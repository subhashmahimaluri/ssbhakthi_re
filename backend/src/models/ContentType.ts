import mongoose, { Document, Schema } from 'mongoose';

export interface IContentType extends Document {
  id: string;
  code: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContentTypeSchema = new Schema<IContentType>(
  {
    code: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 100,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Indexes
ContentTypeSchema.index({ code: 1 }, { unique: true });
ContentTypeSchema.index({ slug: 1 }, { unique: true });
ContentTypeSchema.index({ order: 1 });
ContentTypeSchema.index({ isActive: 1 });
ContentTypeSchema.index({ createdAt: -1 });

export const ContentType = mongoose.model<IContentType>('ContentType', ContentTypeSchema);
