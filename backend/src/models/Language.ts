import mongoose, { Document, Schema } from 'mongoose';

export interface ILanguage extends Document {
  id: string;
  code: string;
  nativeName: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LanguageSchema = new Schema<ILanguage>(
  {
    code: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 10,
    },
    nativeName: {
      type: String,
      required: true,
      trim: true,
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
LanguageSchema.index({ code: 1 }, { unique: true });
LanguageSchema.index({ order: 1 });
LanguageSchema.index({ isActive: 1 });
LanguageSchema.index({ createdAt: -1 });

export const Language = mongoose.model<ILanguage>('Language', LanguageSchema);
