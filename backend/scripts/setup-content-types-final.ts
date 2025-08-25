#!/usr/bin/env tsx

/**
 * Final setup of content_types collection with proper unique indexes
 * Usage: tsx scripts/setup-content-types-final.ts
 */

import mongoose from 'mongoose';

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

async function setupContentTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const collection = mongoose.connection.db.collection('contenttypes');

    console.log('🗑️  Clearing existing collection...');
    await collection.deleteMany({});

    console.log('🗂️  Dropping existing indexes...');
    try {
      await collection.dropIndexes();
    } catch (error) {
      console.log('⚠️  No indexes to drop or error dropping indexes');
    }

    console.log('📦 Creating unique indexes...');

    // Create unique index on code field
    await collection.createIndex({ code: 1 }, { unique: true });
    console.log('✅ Created unique index: { code: 1 }');

    // Create unique index on slug field
    await collection.createIndex({ slug: 1 }, { unique: true });
    console.log('✅ Created unique index: { slug: 1 }');

    // Create other indexes
    await collection.createIndex({ order: 1 });
    console.log('✅ Created index: { order: 1 }');

    await collection.createIndex({ isActive: 1 });
    console.log('✅ Created index: { isActive: 1 }');

    await collection.createIndex({ createdAt: -1 });
    console.log('✅ Created index: { createdAt: -1 }');

    console.log('💾 Inserting content types...');

    // Insert documents with timestamps
    const now = new Date();
    const docsToInsert = contentTypes.map(ct => ({
      code: ct.code,
      name: ct.name,
      slug: ct.slug,
      order: ct.order,
      isActive: ct.isActive,
      createdAt: now,
      updatedAt: now,
    }));

    await collection.insertMany(docsToInsert);
    console.log('✅ Inserted content type documents');

    // Verify the setup
    console.log('\n🔍 Verification:');

    // List all indexes
    const indexes = await collection.indexes();
    console.log(`\n🗂️  Indexes (${indexes.length}):`);
    for (const index of indexes) {
      const unique = index.unique ? ' (UNIQUE)' : '';
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}${unique}`);
    }

    // Show documents
    const documents = await collection.find({}).sort({ order: 1 }).toArray();
    console.log(`\n📋 Content Types (${documents.length}):`);
    for (const doc of documents) {
      console.log(`   ${doc.order}. ${doc.name} (${doc.code}) -> /${doc.slug}`);
      console.log(`      Active: ${doc.isActive}`);
      console.log(`      Created: ${doc.createdAt.toISOString()}`);
      console.log(`      Updated: ${doc.updatedAt.toISOString()}`);
    }

    // Test unique constraints
    console.log('\n🧪 Testing unique constraints...');

    try {
      await collection.insertOne({
        code: 'stotra', // Duplicate code
        name: 'Test Duplicate',
        slug: 'test-duplicate',
        order: 99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ Unique constraint on code field NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint on code field is working');
      }
    }

    try {
      await collection.insertOne({
        code: 'test',
        name: 'Test Duplicate',
        slug: 'stotra', // Duplicate slug
        order: 99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ Unique constraint on slug field NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint on slug field is working');
      }
    }

    console.log('\n✅ Content types collection setup completed successfully!');
    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contenttypes`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Indexes: ${indexes.length} (including 2 unique)`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

setupContentTypes();
