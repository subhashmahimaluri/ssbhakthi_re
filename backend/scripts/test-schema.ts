#!/usr/bin/env tsx

import mongoose from 'mongoose';

const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function testSchema() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const contentsCollection = db.collection('contents');

    console.log('🧪 Testing minimal document with new schema...');

    const testDoc = {
      contentType: 'article',
      canonicalSlug: 'test-minimal-' + Date.now(),
      status: 'draft',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      translations: {
        en: {
          title: 'Minimal Test Article',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('📄 Document to insert:', JSON.stringify(testDoc, null, 2));

    try {
      const result = await contentsCollection.insertOne(testDoc);
      console.log('✅ Document inserted successfully!');
      console.log('Document ID:', result.insertedId);
    } catch (error: any) {
      console.log('❌ Document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    console.log('\n🧪 Testing with body field...');

    const testDocWithBody = {
      contentType: 'article',
      canonicalSlug: 'test-with-body-' + Date.now(),
      status: 'draft',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      translations: {
        en: {
          title: 'Test Article with Body',
          body: '<p>Test content</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await contentsCollection.insertOne(testDocWithBody);
      console.log('✅ Document with body inserted successfully!');
      console.log('Document ID:', result.insertedId);
    } catch (error: any) {
      console.log('❌ Document with body failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

testSchema();
