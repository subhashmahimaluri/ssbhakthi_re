#!/usr/bin/env tsx

/**
 * Create indexes for content_types collection
 * Usage: tsx scripts/create-content-types-indexes.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function createContentTypesIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const collection = mongoose.connection.db.collection('contenttypes');

    console.log('🗂️  Creating unique indexes...');

    // Create unique index on code field
    try {
      await collection.createIndex({ code: 1 }, { unique: true });
      console.log('✅ Created unique index on code field');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('⚠️  Index on code field already exists');
      } else {
        console.log('❌ Error creating code index:', error.message);
      }
    }

    // Create unique index on slug field
    try {
      await collection.createIndex({ slug: 1 }, { unique: true });
      console.log('✅ Created unique index on slug field');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('⚠️  Index on slug field already exists');
      } else {
        console.log('❌ Error creating slug index:', error.message);
      }
    }

    // Create other indexes
    try {
      await collection.createIndex({ order: 1 });
      console.log('✅ Created index on order field');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('⚠️  Index on order field already exists');
      } else {
        console.log('❌ Error creating order index:', error.message);
      }
    }

    try {
      await collection.createIndex({ isActive: 1 });
      console.log('✅ Created index on isActive field');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('⚠️  Index on isActive field already exists');
      } else {
        console.log('❌ Error creating isActive index:', error.message);
      }
    }

    try {
      await collection.createIndex({ createdAt: -1 });
      console.log('✅ Created index on createdAt field');
    } catch (error: any) {
      if (error.code === 85) {
        console.log('⚠️  Index on createdAt field already exists');
      } else {
        console.log('❌ Error creating createdAt index:', error.message);
      }
    }

    // List all indexes
    console.log('\n🔍 All indexes:');
    const indexes = await collection.indexes();
    for (const index of indexes) {
      const unique = index.unique ? ' (UNIQUE)' : '';
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}${unique}`);
    }

    // Test unique constraints
    console.log('\n🧪 Testing unique constraints...');

    try {
      await collection.insertOne({
        code: 'stotra', // Duplicate code
        name: 'Duplicate Stotra',
        slug: 'duplicate-stotra',
        order: 99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ Unique constraint on code field NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint on code field is working');
      } else {
        console.log('⚠️  Unexpected error testing code uniqueness:', error.message);
      }
    }

    try {
      await collection.insertOne({
        code: 'duplicate',
        name: 'Duplicate Articles',
        slug: 'articles', // Duplicate slug
        order: 99,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ Unique constraint on slug field NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint on slug field is working');
      } else {
        console.log('⚠️  Unexpected error testing slug uniqueness:', error.message);
      }
    }

    console.log('\n✅ Index creation completed!');
    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contenttypes`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

createContentTypesIndexes();
