import mongoose, { Document, Schema } from 'mongoose';

export type CommentStatus = 'approved' | 'pending' | 'spam';

export interface IComment extends Document {
  id: string;
  contentId: mongoose.Types.ObjectId | null; // Allow null for development
  canonicalSlug: string;
  lang: string;
  userId: string;
  userName: string;
  userEmail?: string;
  text: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      required: false, // Allow null for development testing
      ref: 'Content',
    },
    canonicalSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 150,
    },
    lang: {
      type: String,
      required: true,
      enum: ['en', 'te', 'hi', 'kn'],
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    status: {
      type: String,
      required: true,
      enum: ['approved', 'pending', 'spam'],
      default: 'approved',
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
    toObject: {
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
CommentSchema.index({ contentId: 1, lang: 1 });
CommentSchema.index({ canonicalSlug: 1, lang: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ status: 1 });
CommentSchema.index({ createdAt: -1 });

// Index for efficient pagination and filtering
CommentSchema.index({ canonicalSlug: 1, lang: 1, status: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
