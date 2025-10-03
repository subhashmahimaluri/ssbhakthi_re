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

  // Language-specific fields
  locale: string;

  // Image processing fields
  variants: {
    original: {
      url: string;
      path: string;
      width: number;
      height: number;
      size: number;
    };
    webp?: {
      url: string;
      path: string;
      size: number;
    };
    thumbnail?: {
      url: string;
      path: string;
      width: number;
      height: number;
      size: number;
    };
    webpThumbnail?: {
      url: string;
      path: string;
      size: number;
    };
    responsive?: Array<{
      url: string;
      path: string;
      width: number;
      size: number;
    }>;
  };

  // Processing metadata
  processingMetadata: {
    originalFormat: string;
    originalSize: number;
    originalWidth: number;
    originalHeight: number;
    compressionRatio: number;
    processingDate: Date;
    hasWebP: boolean;
    hasThumbnail: boolean;
    hasResponsive: boolean;
  };

  // Content association
  contentType?: 'article' | 'stotra' | 'general';
  contentId?: string;

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

    // Language-specific fields
    locale: {
      type: String,
      required: true,
      enum: ['te', 'en', 'hi', 'kn'],
      default: 'te',
    },

    // Image variants
    variants: {
      original: {
        url: { type: String, required: true },
        path: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        size: { type: Number, required: true },
      },
      webp: {
        url: String,
        path: String,
        size: Number,
      },
      thumbnail: {
        url: String,
        path: String,
        width: Number,
        height: Number,
        size: Number,
      },
      webpThumbnail: {
        url: String,
        path: String,
        size: Number,
      },
      responsive: [
        {
          url: String,
          path: String,
          width: Number,
          size: Number,
        },
      ],
    },

    // Processing metadata
    processingMetadata: {
      originalFormat: { type: String, required: true },
      originalSize: { type: Number, required: true },
      originalWidth: { type: Number, required: true },
      originalHeight: { type: Number, required: true },
      compressionRatio: { type: Number, default: 1 },
      processingDate: { type: Date, default: Date.now },
      hasWebP: { type: Boolean, default: false },
      hasThumbnail: { type: Boolean, default: false },
      hasResponsive: { type: Boolean, default: false },
    },

    // Content association
    contentType: {
      type: String,
      enum: ['article', 'stotra', 'general'],
      default: 'general',
    },
    contentId: String,
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
MediaAssetSchema.index({ locale: 1 });
MediaAssetSchema.index({ contentType: 1, contentId: 1 });
MediaAssetSchema.index({ filename: 1, locale: 1 });

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', MediaAssetSchema);
