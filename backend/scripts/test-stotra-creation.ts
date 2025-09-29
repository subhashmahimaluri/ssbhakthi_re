#!/usr/bin/env tsx

/**
 * Test stotra creation with the current schema
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function testStotraCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const contentsCollection = db.collection('contents');

    console.log('🧪 Testing stotra creation with proper structure...');

    // This is the exact structure that the frontend should be sending
    const stotraDoc = {
      contentType: 'stotra',
      canonicalSlug: 'test-frontend-creation',
      stotraTitle: 'Test Stotra Title',
      status: 'draft',
      imageUrl: null,
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      translations: {
        en: {
          title: 'Test English Title',
          seoTitle: null,
          videoId: null,
          stotra: '<p>Test stotra content</p>',
          stotraMeaning: '<p>Test meaning</p>',
          body: null,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Clean up any existing test document
      await contentsCollection.deleteMany({ canonicalSlug: 'test-frontend-creation' });

      console.log('📤 Inserting document:', JSON.stringify(stotraDoc, null, 2));

      const result = await contentsCollection.insertOne(stotraDoc);
      console.log('✅ Stotra document inserted successfully!');
      console.log('Document ID:', result.insertedId);

      // Verify the document was inserted correctly
      const insertedDoc = await contentsCollection.findOne({ _id: result.insertedId });
      console.log('📄 Inserted document structure:', JSON.stringify(insertedDoc, null, 2));

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
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

testStotraCreation();
