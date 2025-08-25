#!/usr/bin/env tsx

/**
 * Create content_types collection and insert documents
 * Usage: tsx scripts/insert-content-types.ts
 */

import mongoose from 'mongoose';
import { ContentType } from '../src/models/ContentType';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

// Content type definitions
const contentTypes = [
  {
    code: 'stotra',
    name: 'Stotra',
    slug: 'stotra',
    order: 0,
    isActive: true,
  },
  {
    code: 'article',
    name: 'Articles',
    slug: 'articles',
    order: 1,
    isActive: true,
  },
];

async function insertContentTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: 'content_types' })
      .toArray();
    const collectionExists = collections.length > 0;

    if (collectionExists) {
      console.log('📦 Content types collection already exists');
      const existingCount = await ContentType.countDocuments();
      console.log(`   Current documents: ${existingCount}`);
    } else {
      console.log('📦 Creating content_types collection...');
    }

    console.log('🗑️  Clearing existing content types...');
    await ContentType.deleteMany({});

    console.log('💾 Inserting content types...');

    // Create content type documents with explicit timestamps
    const now = new Date();
    const contentTypeDocs = contentTypes.map(
      ct =>
        new ContentType({
          code: ct.code,
          name: ct.name,
          slug: ct.slug,
          order: ct.order,
          isActive: ct.isActive,
          createdAt: now,
          updatedAt: now,
        })
    );

    const savedDocs = await ContentType.insertMany(contentTypeDocs);

    console.log('✅ Content types inserted successfully!');

    // Verify indexes
    const indexes = await ContentType.collection.getIndexes();
    console.log(`\n🗂️  Indexes created (${Object.keys(indexes).length}):`);
    for (const [name, index] of Object.entries(indexes)) {
      console.log(`   - ${name}: ${JSON.stringify(index)}`);
    }

    // Show results sorted by order
    console.log('\n📊 Content Types (sorted by order):');
    const sortedContentTypes = await ContentType.find().sort({ order: 1 });
    for (const ct of sortedContentTypes) {
      console.log(`   ${ct.order}. ${ct.name} (${ct.code}) -> /${ct.slug}`);
      console.log(`      Active: ${ct.isActive}`);
      console.log(`      Created: ${ct.createdAt.toISOString()}`);
      console.log(`      Updated: ${ct.updatedAt.toISOString()}`);
    }

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: content_types`);
    console.log(`   Documents: ${sortedContentTypes.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

insertContentTypes();
