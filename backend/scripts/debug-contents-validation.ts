#!/usr/bin/env tsx

/**
 * Debug contents collection validation issues
 * Usage: npx tsx scripts/debug-contents-validation.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function debugValidation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    const contentsCollection = db.collection('contents');

    console.log('🧪 Testing minimal valid document...');

    // Test with absolute minimal document
    const minimalDoc = {
      contentType: 'stotra',
      canonicalSlug: 'test-minimal',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      status: 'draft',
      translations: {
        en: {
          title: 'Test Title',
          slug: 'test-slug',
          path: '/en/test-path',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await contentsCollection.deleteMany({ canonicalSlug: 'test-minimal' });
      const result = await contentsCollection.insertOne(minimalDoc);
      console.log('✅ Minimal document inserted successfully');
      console.log('Document ID:', result.insertedId);
    } catch (error: any) {
      console.log('❌ Minimal document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    console.log('\n🧪 Testing document with optional fields...');

    const fullDoc = {
      contentType: 'stotra',
      canonicalSlug: 'test-full',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      imageUrl: null,
      status: 'published',
      translations: {
        en: {
          title: 'Full Test Title',
          seoTitle: 'SEO Title',
          youtubeUrl: 'https://youtube.com/test',
          slug: 'full-test-slug',
          path: '/en/full-test-path',
          stotra: '<p>Test stotra content</p>',
          stotraMeaning: '<p>Test meaning</p>',
          body: null,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await contentsCollection.deleteMany({ canonicalSlug: 'test-full' });
      const result = await contentsCollection.insertOne(fullDoc);
      console.log('✅ Full document inserted successfully');
      console.log('Document ID:', result.insertedId);
    } catch (error: any) {
      console.log('❌ Full document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    console.log('\n🧪 Testing article document...');

    const articleDoc = {
      contentType: 'article',
      canonicalSlug: 'test-article',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      imageUrl: null,
      status: 'draft',
      translations: {
        en: {
          title: 'Test Article',
          seoTitle: null,
          youtubeUrl: null,
          slug: 'test-article',
          path: '/en/articles/test-article',
          stotra: null,
          stotraMeaning: null,
          body: '<p>Test article content</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await contentsCollection.deleteMany({ canonicalSlug: 'test-article' });
      const result = await contentsCollection.insertOne(articleDoc);
      console.log('✅ Article document inserted successfully');
      console.log('Document ID:', result.insertedId);
    } catch (error: any) {
      console.log('❌ Article document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    // Show current collection info
    const totalDocs = await contentsCollection.countDocuments();
    console.log(`\n📊 Total documents in collection: ${totalDocs}`);

    if (totalDocs > 0) {
      const docs = await contentsCollection.find({}).toArray();
      console.log('\n📋 Current documents:');
      for (const doc of docs) {
        console.log(
          `   - ${doc.contentType}: ${doc.canonicalSlug} (${Object.keys(doc.translations).join(', ')})`
        );
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

debugValidation();
