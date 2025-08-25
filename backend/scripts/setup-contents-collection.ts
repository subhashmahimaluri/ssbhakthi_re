#!/usr/bin/env tsx

/**
 * Setup contents collection with multilingual support
 * - JSON Schema validation
 * - Partial unique indexes for per-language slugs/paths
 * - Example inserts and updates for Stotra and Article
 *
 * Usage: tsx scripts/setup-contents-collection.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function setupContentsCollection() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;

    // Drop existing collection if it exists
    try {
      console.log('🗑️  Dropping existing contents collection...');
      await db.collection('contents').drop();
      console.log('✅ Existing contents collection dropped');
    } catch (error) {
      console.log('ℹ️  No existing contents collection to drop');
    }

    console.log('📦 Creating contents collection with JSON Schema validation...');

    // 1) Create contents collection with JSON Schema validation
    await db.createCollection('contents', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'contentType',
            'canonicalSlug',
            'categories',
            'translations',
            'status',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            contentType: { enum: ['stotra', 'article'] },
            canonicalSlug: { bsonType: 'string', minLength: 1 },
            categories: {
              bsonType: 'object',
              required: ['typeIds', 'devaIds', 'byNumberIds'],
              properties: {
                typeIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
                devaIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
                byNumberIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
              },
              additionalProperties: false,
            },
            imageUrl: { bsonType: ['string', 'null'] },
            status: { enum: ['draft', 'published'] },

            translations: {
              bsonType: 'object',
              patternProperties: {
                '^(en|te|hi|kn)$': {
                  bsonType: 'object',
                  required: ['title', 'slug', 'path'],
                  properties: {
                    title: { bsonType: 'string', minLength: 1 },
                    seoTitle: { bsonType: ['string', 'null'] },
                    youtubeUrl: { bsonType: ['string', 'null'] },
                    slug: { bsonType: 'string', minLength: 1 },
                    path: { bsonType: 'string', minLength: 1 },

                    // Stotra fields (optional at schema, enforced by app based on contentType)
                    stotra: { bsonType: ['string', 'null'] },
                    stotraMeaning: { bsonType: ['string', 'null'] },

                    // Article field
                    body: { bsonType: ['string', 'null'] },
                  },
                  additionalProperties: false,
                },
              },
              additionalProperties: false,
            },

            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' },
            _id: { bsonType: 'objectId' },
          },
          additionalProperties: false,
        },
      },
    });

    console.log('✅ Contents collection created with JSON Schema validation');

    console.log('🗂️  Creating indexes...');

    const contentsCollection = db.collection('contents');

    // 2) Create indexes

    // Uniqueness for canonical slug
    await contentsCollection.createIndex({ canonicalSlug: 1 }, { unique: true });
    console.log('✅ Created unique index: { canonicalSlug: 1 }');

    // Per-language unique slug (only when that language exists)
    await contentsCollection.createIndex(
      { 'translations.en.slug': 1 },
      { unique: true, partialFilterExpression: { 'translations.en.slug': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.en.slug": 1 }');

    await contentsCollection.createIndex(
      { 'translations.te.slug': 1 },
      { unique: true, partialFilterExpression: { 'translations.te.slug': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.te.slug": 1 }');

    await contentsCollection.createIndex(
      { 'translations.hi.slug': 1 },
      { unique: true, partialFilterExpression: { 'translations.hi.slug': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.hi.slug": 1 }');

    await contentsCollection.createIndex(
      { 'translations.kn.slug': 1 },
      { unique: true, partialFilterExpression: { 'translations.kn.slug': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.kn.slug": 1 }');

    // Per-language unique path
    await contentsCollection.createIndex(
      { 'translations.en.path': 1 },
      { unique: true, partialFilterExpression: { 'translations.en.path': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.en.path": 1 }');

    await contentsCollection.createIndex(
      { 'translations.te.path': 1 },
      { unique: true, partialFilterExpression: { 'translations.te.path': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.te.path": 1 }');

    await contentsCollection.createIndex(
      { 'translations.hi.path': 1 },
      { unique: true, partialFilterExpression: { 'translations.hi.path': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.hi.path": 1 }');

    await contentsCollection.createIndex(
      { 'translations.kn.path': 1 },
      { unique: true, partialFilterExpression: { 'translations.kn.path': { $exists: true } } }
    );
    console.log('✅ Created partial unique index: { "translations.kn.path": 1 }');

    // Category filters
    await contentsCollection.createIndex({ 'categories.typeIds': 1 });
    console.log('✅ Created index: { "categories.typeIds": 1 }');

    await contentsCollection.createIndex({ 'categories.devaIds': 1 });
    console.log('✅ Created index: { "categories.devaIds": 1 }');

    await contentsCollection.createIndex({ 'categories.byNumberIds': 1 });
    console.log('✅ Created index: { "categories.byNumberIds": 1 }');

    // Other useful indexes
    await contentsCollection.createIndex({ contentType: 1 });
    console.log('✅ Created index: { contentType: 1 }');

    await contentsCollection.createIndex({ status: 1 });
    console.log('✅ Created index: { status: 1 }');

    await contentsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Created index: { createdAt: -1 }');

    await contentsCollection.createIndex({ updatedAt: -1 });
    console.log('✅ Created index: { updatedAt: -1 }');

    // Fulltext search index (optional)
    await contentsCollection.createIndex({
      'translations.en.title': 'text',
      'translations.en.seoTitle': 'text',
    });
    console.log('✅ Created text index for English title and seoTitle');

    console.log('\n🔍 Verifying setup...');

    // List all indexes
    const indexes = await contentsCollection.indexes();
    console.log(`\n🗂️  Total indexes created: ${indexes.length}`);
    for (const index of indexes) {
      const unique = index.unique ? ' (UNIQUE)' : '';
      const partial = index.partialFilterExpression ? ' (PARTIAL)' : '';
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}${unique}${partial}`);
    }

    // Helper function to resolve category ids (taxonomy + slug)
    console.log('\n📋 Setting up helper functions and example data...');

    async function cat(taxonomy: string, slug: string) {
      const categoriesCollection = db.collection('categories');
      const category = await categoriesCollection.findOne({
        'meta.taxonomy': taxonomy,
        'slug.en': slug,
      });
      if (!category) {
        throw new Error(`Category not found: ${taxonomy}/${slug}`);
      }
      return category._id;
    }

    console.log('💾 Inserting example documents...');

    const now = new Date();

    try {
      // 4) Sample STOTRA (EN only first)
      const stotraDoc = {
        contentType: 'stotra',
        canonicalSlug: 'shiva-tandava-stotra',
        categories: {
          typeIds: [await cat('type', 'stotra-generic')],
          devaIds: [await cat('deva', 'shiva')],
          byNumberIds: [],
        },
        imageUrl: null,
        status: 'published',
        translations: {
          en: {
            title: 'Shiva Tandava Stotra',
            seoTitle: 'Shiva Tandava Stotra — Hymn of Shiva',
            youtubeUrl: null,
            slug: 'shiva-tandava-stotra',
            path: '/en/stotra/shiva/shiva-tandava-stotra',
            stotra: '<p>Jatatavigalajjala pravatapavitasthale...</p>',
            stotraMeaning: '<p>A hymn describing the cosmic dance of Shiva...</p>',
            body: null,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      await contentsCollection.insertOne(stotraDoc);
      console.log('✅ Inserted sample Stotra document');

      // 5) Sample ARTICLE (EN only first)
      const articleDoc = {
        contentType: 'article',
        canonicalSlug: 'meaning-of-suprabhata-traditions',
        categories: {
          typeIds: [await cat('type', 'suprabhata')],
          devaIds: [],
          byNumberIds: [],
        },
        imageUrl: null,
        status: 'draft',
        translations: {
          en: {
            title: 'Meaning of Suprabhata Traditions',
            seoTitle: 'Suprabhata: Origins and Practice',
            youtubeUrl: null,
            slug: 'meaning-of-suprabhata-traditions',
            path: '/en/articles/meaning-of-suprabhata-traditions',
            stotra: null,
            stotraMeaning: null,
            body: '<p>Suprabhata is traditionally sung at dawn...</p>',
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      await contentsCollection.insertOne(articleDoc);
      console.log('✅ Inserted sample Article document');
    } catch (error) {
      console.log('⚠️  Could not insert example documents (categories may not exist yet)');
      console.log('   Error:', (error as Error).message);
    }

    console.log('\n🧪 Demonstrating language-only updates...');

    try {
      // 6) Language-only UPDATE examples

      // Add Telugu translation for the Stotra (only language block changes)
      await contentsCollection.updateOne(
        { canonicalSlug: 'shiva-tandava-stotra' },
        {
          $set: {
            'translations.te': {
              title: 'శివ తాండవ స్తోత్రం',
              seoTitle: 'శివ తాండవ స్తోత్రం — శివుని స్తుతి',
              youtubeUrl: null,
              slug: 'శివ-తాండవ-స్తోత్రం',
              path: '/te/stotra/shiva/శివ-తాండవ-స్తోత్రం',
              stotra: '<p>జటాటావిగలజ్జల...</p>',
              stotraMeaning: '<p>శివుని తాండవ నృత్యాన్ని వర్ణించే స్తోత్రం...</p>',
              body: null,
            },
            updatedAt: new Date(),
          },
        }
      );
      console.log('✅ Added Telugu translation to Stotra');

      // Update only EN fields of Article
      await contentsCollection.updateOne(
        { canonicalSlug: 'meaning-of-suprabhata-traditions' },
        {
          $set: {
            'translations.en.title': 'Suprabhata: Meaning and Tradition',
            'translations.en.youtubeUrl': 'https://youtube.com/sample-video',
            'translations.en.seoTitle': 'Suprabhata Meaning & Practice',
            updatedAt: new Date(),
          },
        }
      );
      console.log('✅ Updated English fields of Article');
    } catch (error) {
      console.log('⚠️  Could not perform example updates');
      console.log('   Error:', (error as Error).message);
    }

    // Verify final state
    console.log('\n🔍 Final verification...');
    const totalDocs = await contentsCollection.countDocuments();
    console.log(`📊 Total documents in contents collection: ${totalDocs}`);

    if (totalDocs > 0) {
      const sampleDocs = await contentsCollection.find({}).limit(2).toArray();
      console.log('\n📋 Sample documents:');
      for (const doc of sampleDocs) {
        console.log(`   - ${doc.contentType}: ${doc.canonicalSlug}`);
        console.log(`     Languages: ${Object.keys(doc.translations).join(', ')}`);
        console.log(`     Status: ${doc.status}`);
      }
    }

    console.log('\n✅ Contents collection setup completed successfully!');
    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contents`);
    console.log(`   Documents: ${totalDocs}`);
    console.log(
      `   Indexes: ${indexes.length} (including ${indexes.filter(i => i.unique).length} unique, ${indexes.filter(i => i.partialFilterExpression).length} partial)`
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

setupContentsCollection();
