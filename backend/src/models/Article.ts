import mongoose, { Document, Schema } from 'mongoose';
import { LocaleString } from './Category';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface AuditInfo {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
}

export interface ArticleSchedule {
  publishAt?: Date;
  unpublishAt?: Date;
}

export interface IArticle extends Document {
  id: string;
  type: string; // news, blog, announcement, etc.
  title: LocaleString;
  slug: LocaleString;
  summary?: LocaleString;
  bodyHtml?: LocaleString;
  cover?: string; // MediaAsset ID
  categories: string[]; // Category IDs
  tags: string[]; // Tag IDs
  locales: string[]; // Available languages
  status: ArticleStatus;
  revision: number;
  schedule?: ArticleSchedule;
  seo?: Record<string, any>;
  meta?: Record<string, any>;
  audit: AuditInfo;
  isActive: boolean;
}

const LocaleStringSchema = new Schema<LocaleString>(
  {
    en: String,
    te: String,
  },
  { _id: false }
);

const AuditInfoSchema = new Schema<AuditInfo>(
  {
    createdBy: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ArticleScheduleSchema = new Schema<ArticleSchedule>(
  {
    publishAt: Date,
    unpublishAt: Date,
  },
  { _id: false }
);

const ArticleSchema = new Schema<IArticle>(
  {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: LocaleStringSchema,
      required: true,
    },
    slug: {
      type: LocaleStringSchema,
      required: true,
    },
    summary: LocaleStringSchema,
    bodyHtml: LocaleStringSchema,
    cover: {
      type: String,
      ref: 'MediaAsset',
    },
    categories: [
      {
        type: String,
        ref: 'Category',
      },
    ],
    tags: [
      {
        type: String,
        ref: 'Tag',
      },
    ],
    locales: {
      type: [String],
      required: true,
      default: ['en'],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'At least one locale is required',
      },
    },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT,
    },
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
    schedule: ArticleScheduleSchema,
    seo: {
      type: Schema.Types.Mixed,
      default: {},
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    audit: {
      type: AuditInfoSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: false, // We use audit.createdAt and audit.updatedAt
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

// Update audit.updatedAt on save
ArticleSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.audit.updatedAt = new Date();
    this.revision += 1;
  }
  next();
});

// Compound indexes for unique slug per locale
ArticleSchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
ArticleSchema.index({ 'slug.te': 1 }, { unique: true, sparse: true });

// Performance indexes
ArticleSchema.index({ type: 1, status: 1 });
ArticleSchema.index({ status: 1, 'audit.updatedAt': -1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ locales: 1 });
ArticleSchema.index({ 'audit.createdBy': 1 });
ArticleSchema.index({ 'audit.createdAt': -1 });
ArticleSchema.index({ 'audit.updatedAt': -1 });
ArticleSchema.index({ isActive: 1 });

// Text search index
ArticleSchema.index({
  'title.en': 'text',
  'title.te': 'text',
  'summary.en': 'text',
  'summary.te': 'text',
});

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
