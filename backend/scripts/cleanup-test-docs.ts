#!/usr/bin/env tsx

/**
 * Cleanup test documents and show final state
 */

import mongoose from 'mongoose';

const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    const contentsCollection = db.collection('contents');

    // Remove test documents
    const result = await contentsCollection.deleteMany({
      canonicalSlug: { $in: ['test-minimal', 'test-full', 'test-article'] },
    });
    console.log('🗑️  Cleaned up', result.deletedCount, 'test documents');

    const finalCount = await contentsCollection.countDocuments();
    console.log('📊 Final document count:', finalCount);

    if (finalCount > 0) {
      const docs = await contentsCollection.find({}).toArray();
      console.log('\n📋 Final documents:');
      for (const doc of docs) {
        console.log(
          `   - ${doc.contentType}: ${doc.canonicalSlug} (${Object.keys(doc.translations).join(', ')})`
        );
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanup();
