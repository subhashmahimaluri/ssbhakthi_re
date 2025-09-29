#!/usr/bin/env tsx

/**
 * Test the new schema validation with correct fields
 * Usage: npx tsx scripts/test-new-schema.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function testNewSchema() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const contentsCollection = db.collection('contents');

    console.log('🧪 Testing stotra with correct schema...');

    // Test with only allowed fields
    const stotraDoc = {
      contentType: 'stotra',
      canonicalSlug: 'test-new-schema-stotra',
      stotraTitle: 'Test Stotra Title', // New field
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      status: 'draft',
      translations: {
        en: {
          title: 'Test English Title',
          seoTitle: 'Test SEO Title',
          videoId: 'dQw4w9WgXcQ', // YouTube video ID format
          stotra: '<p>Test stotra content</p>',
          stotraMeaning: '<p>Test meaning</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Clean up any existing test document
      await contentsCollection.deleteMany({ canonicalSlug: 'test-new-schema-stotra' });

      const result = await contentsCollection.insertOne(stotraDoc);
      console.log('✅ Stotra document inserted successfully!');
      console.log('Document ID:', result.insertedId);

      // Clean up
      await contentsCollection.deleteOne({ _id: result.insertedId });
      console.log('🧹 Test document cleaned up');
    } catch (error: any) {
      console.log('❌ Stotra document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    console.log('\n🧪 Testing article with correct schema...');

    const articleDoc = {
      contentType: 'article',
      canonicalSlug: 'test-new-schema-article',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      status: 'draft',
      translations: {
        en: {
          title: 'Test Article Title',
          seoTitle: 'Test Article SEO Title',
          body: '<p>Test article content</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Clean up any existing test document
      await contentsCollection.deleteMany({ canonicalSlug: 'test-new-schema-article' });

      const result = await contentsCollection.insertOne(articleDoc);
      console.log('✅ Article document inserted successfully!');
      console.log('Document ID:', result.insertedId);

      // Clean up
      await contentsCollection.deleteOne({ _id: result.insertedId });
      console.log('🧹 Test document cleaned up');
    } catch (error: any) {
      console.log('❌ Article document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
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

testNewSchema();
