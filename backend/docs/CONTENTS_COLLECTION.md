# Contents Collection - Multilingual CMS Implementation

## Overview

The `contents` collection is a sophisticated multilingual content management system designed for storing both Stotras (hymns) and Articles with full translation support across multiple languages (English, Telugu, Hindi, Kannada).

## Features

### ✅ Core Capabilities

- **Multilingual Support**: Store translations for en, te, hi, kn in a single document
- **Content Types**: Support for both `stotra` and `article` content types
- **JSON Schema Validation**: Strict document structure enforcement at database level
- **Unique Constraints**: Per-language unique slugs and paths using partial indexes
- **Hierarchical Categories**: Integration with existing category taxonomy system
- **Full-text Search**: English title and SEO title indexing
- **TypeScript Support**: Complete Mongoose model with type safety

### ✅ Technical Implementation

- **Database**: MongoDB with JSON Schema validation
- **Indexes**: 18 total (9 unique, 8 partial, 1 text search)
- **Framework**: Mongoose ODM with TypeScript
- **Validation**: Both JSON Schema (MongoDB) and Mongoose validation layers

## Collection Structure

### Document Schema

```typescript
interface IContent {
  id: string;
  contentType: 'stotra' | 'article';
  canonicalSlug: string; // Global unique identifier
  categories: {
    typeIds: ObjectId[]; // Type taxonomy (stotra, article, etc.)
    devaIds: ObjectId[]; // Deity taxonomy (shiva, vishnu, etc.)
    byNumberIds: ObjectId[]; // Number taxonomy (panchaka, ashtaka, etc.)
  };
  imageUrl?: string | null;
  status: 'draft' | 'published';
  translations: {
    [languageCode]: {
      title: string; // Required: Content title
      seoTitle?: string | null; // Optional: SEO optimized title
      youtubeUrl?: string | null; // Optional: Associated video
      slug: string; // Required: URL slug (unique per language)
      path: string; // Required: Full URL path (unique per language)

      // Content type specific fields
      stotra?: string | null; // HTML content for stotras
      stotraMeaning?: string | null; // Meaning/translation for stotras
      body?: string | null; // HTML content for articles
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Index Strategy

1. **Unique Indexes**
   - `canonicalSlug` (global uniqueness)
   - `translations.en.slug` (partial - only when EN translation exists)
   - `translations.te.slug` (partial - only when TE translation exists)
   - `translations.hi.slug` (partial - only when HI translation exists)
   - `translations.kn.slug` (partial - only when KN translation exists)
   - `translations.en.path` (partial - only when EN path exists)
   - `translations.te.path` (partial - only when TE path exists)
   - `translations.hi.path` (partial - only when HI path exists)
   - `translations.kn.path` (partial - only when KN path exists)

2. **Query Indexes**
   - `contentType` - Filter by stotra/article
   - `status` - Filter by draft/published
   - `categories.typeIds` - Filter by type categories
   - `categories.devaIds` - Filter by deity categories
   - `categories.byNumberIds` - Filter by number categories
   - `createdAt` (descending) - Sort by creation date
   - `updatedAt` (descending) - Sort by modification date

3. **Search Index**
   - Text index on `translations.en.title` and `translations.en.seoTitle`

## Usage Examples

### 1. Insert New Stotra (English Only)

```javascript
await db.contents.insertOne({
  contentType: 'stotra',
  canonicalSlug: 'hanuman-chalisa',
  categories: {
    typeIds: [ObjectId('...')],
    devaIds: [ObjectId('...')],
    byNumberIds: [],
  },
  imageUrl: null,
  status: 'published',
  translations: {
    en: {
      title: 'Hanuman Chalisa',
      seoTitle: 'Hanuman Chalisa - Complete Hymn',
      youtubeUrl: null,
      slug: 'hanuman-chalisa',
      path: '/en/stotra/hanuman/hanuman-chalisa',
      stotra: '<p>Stotra content...</p>',
      stotraMeaning: '<p>Meaning...</p>',
      body: null,
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 2. Add Translation (Language-Only Update)

```javascript
await db.contents.updateOne(
  { canonicalSlug: 'hanuman-chalisa' },
  {
    $set: {
      'translations.te': {
        title: 'హనుమాన్ చాలీసా',
        seoTitle: 'హనుమాన్ చాలీసా - పూర్ణ స్తోత్రం',
        youtubeUrl: null,
        slug: 'హనుమాన్-చాలీసా',
        path: '/te/stotra/hanuman/హనుమాన్-చాలీసా',
        stotra: '<p>తెలుగు స్తోత్రం...</p>',
        stotraMeaning: '<p>అర్థం...</p>',
        body: null,
      },
      updatedAt: new Date(),
    },
  }
);
```

### 3. Update Specific Fields

```javascript
await db.contents.updateOne(
  { canonicalSlug: 'hanuman-chalisa' },
  {
    $set: {
      'translations.en.youtubeUrl': 'https://youtube.com/...',
      'translations.en.seoTitle': 'Updated SEO Title',
      updatedAt: new Date(),
    },
  }
);
```

### 4. Insert Article

```javascript
await db.contents.insertOne({
  contentType: 'article',
  canonicalSlug: 'temple-traditions',
  categories: {
    typeIds: [ObjectId('...')],
    devaIds: [],
    byNumberIds: [],
  },
  imageUrl: 'https://example.com/image.jpg',
  status: 'draft',
  translations: {
    en: {
      title: 'Temple Traditions',
      seoTitle: 'Understanding Hindu Temple Traditions',
      youtubeUrl: null,
      slug: 'temple-traditions',
      path: '/en/articles/temple-traditions',
      stotra: null,
      stotraMeaning: null,
      body: '<p>Article content...</p>',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## Query Examples

### 1. Content Discovery

```javascript
// Find all published stotras
db.contents.find({ contentType: 'stotra', status: 'published' });

// Find content by English slug
db.contents.findOne({ 'translations.en.slug': 'shiva-tandava-stotra' });

// Find content by Telugu path
db.contents.findOne({ 'translations.te.path': '/te/stotra/shiva/శివ-తాండవ-స్తోత్రం' });
```

### 2. Category-Based Queries

```javascript
// Find content by specific category
db.contents.find({ 'categories.devaIds': ObjectId('...') });

// Find content with any category in type taxonomy
db.contents.find({ 'categories.typeIds': { $in: [ObjectId('...'), ObjectId('...')] } });
```

### 3. Language-Specific Queries

```javascript
// Find content with Telugu translation
db.contents.find({ 'translations.te': { $exists: true } });

// Find content available in multiple languages
db.contents.find({
  'translations.en': { $exists: true },
  'translations.te': { $exists: true },
});
```

### 4. Full-Text Search

```javascript
// Search English content
db.contents.find({ $text: { $search: 'Shiva dance' } });
```

## Mongoose Model Usage

### Using Static Methods

```typescript
import { Content } from '../models/Content';

// Find by slug (any language)
const content = await Content.findBySlug('shiva-tandava-stotra');

// Find by slug (specific language)
const content = await Content.findBySlug('శివ-తాండవ-స్తోత్రం', 'te');

// Find by path
const content = await Content.findByPath('/en/stotra/shiva/shiva-tandava-stotra');

// Find by category
const contents = await Content.findByCategory(categoryId, 'deva');
```

### Standard Mongoose Operations

```typescript
// Create new content
const newContent = new Content({
  contentType: 'stotra',
  canonicalSlug: 'new-stotra',
  categories: { typeIds: [], devaIds: [], byNumberIds: [] },
  status: 'draft',
  translations: {
    en: {
      title: 'New Stotra',
      slug: 'new-stotra',
      path: '/en/stotra/new-stotra',
    },
  },
});
await newContent.save();

// Update existing content
await Content.findOneAndUpdate({ canonicalSlug: 'existing-stotra' }, { status: 'published' });

// Delete content
await Content.findOneAndDelete({ canonicalSlug: 'unwanted-content' });
```

## Benefits

### 🌐 Multilingual Architecture

- **Single Document Storage**: All translations in one document reduces complexity
- **Atomic Updates**: Language additions/updates are atomic operations
- **Consistent URLs**: Language-specific paths enable proper SEO and routing
- **Partial Uniqueness**: Prevents conflicts only when languages exist

### 🔒 Data Integrity

- **JSON Schema Validation**: MongoDB-level enforcement of document structure
- **Mongoose Validation**: Application-level validation with custom rules
- **TypeScript Safety**: Compile-time type checking and IntelliSense support
- **Unique Constraints**: Prevents duplicate slugs and paths per language

### 🚀 Performance

- **Optimized Indexing**: 18 targeted indexes for fast queries
- **Partial Indexes**: Reduced index size and improved performance
- **Category Integration**: Efficient filtering by taxonomy relationships
- **Text Search**: Built-in full-text search capabilities

### 🔄 Workflow Support

- **Draft/Published Status**: Content lifecycle management
- **Language-Only Updates**: Add translations without affecting base content
- **Selective Updates**: Update specific fields without full document replacement
- **Timestamp Tracking**: Automatic creation and modification timestamps

## Files Created

1. **Setup Scripts**
   - `scripts/setup-contents-collection.ts` - Initial collection setup with schema and indexes
   - `scripts/insert-content-examples.ts` - Example documents and multilingual updates
   - `scripts/contents-collection-summary.ts` - Usage documentation and examples
   - `scripts/verify-contents-complete.ts` - Comprehensive testing and verification

2. **Models**
   - `src/models/Content.ts` - Complete Mongoose model with TypeScript types

3. **Documentation**
   - `docs/CONTENTS_COLLECTION.md` - This comprehensive guide

## Testing Results

✅ **All Tests Passed**

- JSON Schema validation working
- Unique constraints functioning properly
- Partial indexes preventing language-specific conflicts
- Mongoose model integration successful
- Static methods operational
- Query performance optimized
- Document structure validated

## MongoDB Admin

Access the collection via MongoDB Admin UI:

- **URL**: http://localhost:8082
- **Database**: ssbhakthi_api
- **Collection**: contents

## Next Steps

1. **Frontend Integration**: Connect Next.js components to the content API
2. **API Endpoints**: Create REST/GraphQL endpoints for content management
3. **Content Migration**: Import existing content from current sources
4. **SEO Optimization**: Implement language-specific sitemap generation
5. **Search Enhancement**: Add advanced search with filters and sorting
6. **Performance Monitoring**: Set up query performance tracking
7. **Backup Strategy**: Implement automated backup for multilingual content

The contents collection is now ready for production use with full multilingual support, data integrity, and optimal performance characteristics.
