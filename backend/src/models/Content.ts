import mongoose, { Document, Schema } from 'mongoose';

// Language codes supported by the system
export type LanguageCode = 'en' | 'te' | 'hi' | 'kn';

// Content types
export type ContentType = 'stotra' | 'article';

// Status values
export type ContentStatus = 'draft' | 'published';

// Translation interface for a specific language
export interface ITranslation {
  title: string;
  seoTitle?: string | null;
  summary?: string | null; // Summary or brief description
  videoId?: string | null;
  imageUrl?: string | null; // Language-specific image URL

  // Stotra-specific fields (used when contentType is 'stotra')
  stotra?: string | null;
  stotraMeaning?: string | null;

  // Article-specific field (used when contentType is 'article')
  body?: string | null;
}

// Categories structure
export interface ICategories {
  typeIds: mongoose.Types.ObjectId[];
  devaIds: mongoose.Types.ObjectId[];
  byNumberIds: mongoose.Types.ObjectId[];
}

// Main content interface
export interface IContent extends Document {
  id: string;
  contentType: ContentType;
  canonicalSlug: string;
  stotraTitle?: string | null; // Common title for all translations (used for Stotras)
  articleTitle?: string | null; // Common title for all translations (used for Articles)
  categories: ICategories;
  imageUrl?: string | null;
  status: ContentStatus;
  translations: Record<string, ITranslation>;
  createdAt: Date;
  updatedAt: Date;
}

// Translation schema (embedded)
// Note: translations field uses Schema.Types.Mixed for flexibility
// const TranslationSchema = new Schema<ITranslation>(...) // Removed to avoid TS6133

// Categories schema (embedded)
const CategoriesSchema = new Schema<ICategories>(
  {
    typeIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'Category',
    },
    devaIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'Category',
    },
    byNumberIds: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'Category',
    },
  },
  {
    _id: false,
  }
);

// Main content schema
const ContentSchema = new Schema<IContent>(
  {
    contentType: {
      type: String,
      required: true,
      enum: ['stotra', 'article'],
    },
    canonicalSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 150,
      validate: {
        validator: function (v: string) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'canonicalSlug must contain only lowercase letters, numbers, and hyphens',
      },
    },
    stotraTitle: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
      validate: {
        validator: function (this: IContent, v: string | null) {
          // stotraTitle is only relevant for stotra content type
          if (this.contentType === 'article' && v) {
            return false;
          }
          return true;
        },
        message: 'stotraTitle should only be used for stotra content type',
      },
    },
    articleTitle: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
      validate: {
        validator: function (this: IContent, v: string | null) {
          // articleTitle is only relevant for article content type
          if (this.contentType === 'stotra' && v) {
            return false;
          }
          return true;
        },
        message: 'articleTitle should only be used for article content type',
      },
    },
    categories: {
      type: CategoriesSchema,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function (v: string | null) {
          if (!v) return true;
          // Accept both full URLs (http/https) and relative paths (starting with /)
          return /^https?:\/\/.+/.test(v) || /^\/.*/.test(v);
        },
        message: 'imageUrl must be a valid URL or relative path starting with /',
      },
    },
    status: {
      type: String,
      required: true,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    translations: {
      type: Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (v: Record<string, ITranslation>) {
          // At least one translation must exist
          return Object.keys(v).length > 0;
        },
        message: 'At least one translation is required',
      },
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

// Indexes (these are handled by the setup script, but defined here for reference)
// Note: canonicalSlug index is created automatically due to unique: true in schema
ContentSchema.index({ contentType: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ createdAt: -1 });
ContentSchema.index({ updatedAt: -1 });

// Category indexes
ContentSchema.index({ 'categories.typeIds': 1 });
ContentSchema.index({ 'categories.devaIds': 1 });
ContentSchema.index({ 'categories.byNumberIds': 1 });

// Text search indexes for multilingual content
ContentSchema.index(
  {
    'translations.en.title': 'text',
    'translations.te.title': 'text',
    'translations.hi.title': 'text',
    'translations.kn.title': 'text',
    'translations.en.summary': 'text',
    'translations.te.summary': 'text',
    'translations.hi.summary': 'text',
    'translations.kn.summary': 'text',
    'translations.en.stotra': 'text',
    'translations.te.stotra': 'text',
    'translations.hi.stotra': 'text',
    'translations.kn.stotra': 'text',
    'translations.en.body': 'text',
    'translations.te.body': 'text',
    'translations.hi.body': 'text',
    'translations.kn.body': 'text',
    stotraTitle: 'text',
    articleTitle: 'text',
  },
  {
    name: 'content_text_search',
    weights: {
      'translations.en.title': 10,
      'translations.te.title': 10,
      'translations.hi.title': 10,
      'translations.kn.title': 10,
      stotraTitle: 10,
      articleTitle: 10,
      'translations.en.summary': 7,
      'translations.te.summary': 7,
      'translations.hi.summary': 7,
      'translations.kn.summary': 7,
      'translations.en.stotra': 5,
      'translations.te.stotra': 5,
      'translations.hi.stotra': 5,
      'translations.kn.stotra': 5,
      'translations.en.body': 3,
      'translations.te.body': 3,
      'translations.hi.body': 3,
      'translations.kn.body': 3,
    },
  }
);

// Static method to find by slug in any language
ContentSchema.statics['findBySlug'] = function (slug: string, language?: LanguageCode) {
  if (language) {
    return this.findOne({ [`translations.${language}.slug`]: slug });
  }

  // Search in all languages
  return this.findOne({
    $or: [
      { 'translations.en.slug': slug },
      { 'translations.te.slug': slug },
      { 'translations.hi.slug': slug },
      { 'translations.kn.slug': slug },
    ],
  });
};

// Static method to find by path
ContentSchema.statics['findByPath'] = function (path: string) {
  return this.findOne({
    $or: [
      { 'translations.en.path': path },
      { 'translations.te.path': path },
      { 'translations.hi.path': path },
      { 'translations.kn.path': path },
    ],
  });
};

// Static method to find by category
ContentSchema.statics['findByCategory'] = function (
  categoryId: mongoose.Types.ObjectId,
  taxonomy?: 'type' | 'deva' | 'byNumber'
) {
  if (taxonomy) {
    return this.find({ [`categories.${taxonomy}Ids`]: categoryId });
  }

  // Search in all category types
  return this.find({
    $or: [
      { 'categories.typeIds': categoryId },
      { 'categories.devaIds': categoryId },
      { 'categories.byNumberIds': categoryId },
    ],
  });
};

export const Content = mongoose.model<IContent>('Content', ContentSchema);
