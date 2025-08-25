import mongoose, { Document, Schema } from 'mongoose';

export interface LocaleString {
  en?: string;
  te?: string;
}

export interface ICategory extends Document {
  id: string;
  name: LocaleString;
  slug: LocaleString;
  description?: LocaleString;
  parent?: string; // Category ID for hierarchical categories
  order: number;
  isActive: boolean;
  meta: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const LocaleStringSchema = new Schema<LocaleString>(
  {
    en: String,
    te: String,
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: LocaleStringSchema,
      required: true,
    },
    slug: {
      type: LocaleStringSchema,
      required: true,
    },
    description: LocaleStringSchema,
    parent: {
      type: String,
      ref: 'Category',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
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

// Compound indexes for unique slug per locale
CategorySchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
CategorySchema.index({ 'slug.te': 1 }, { unique: true, sparse: true });

// Other indexes
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ order: 1 });
CategorySchema.index({ createdBy: 1 });
CategorySchema.index({ createdAt: -1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
