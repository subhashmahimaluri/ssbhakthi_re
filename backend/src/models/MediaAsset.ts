import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaAsset extends Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  meta: Record<string, any>;
  uploadedBy: string; // User ID
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    alt: String,
    caption: String,
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
MediaAssetSchema.index({ mimeType: 1 });
MediaAssetSchema.index({ uploadedBy: 1 });
MediaAssetSchema.index({ tags: 1 });
MediaAssetSchema.index({ isPublic: 1 });
MediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
