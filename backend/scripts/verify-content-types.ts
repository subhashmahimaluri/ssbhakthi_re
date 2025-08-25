#!/usr/bin/env tsx

/**
 * Verify content_types collection, indexes, and data
 * Usage: tsx scripts/verify-content-types.ts
 */

import mongoose from 'mongoose';
import { ContentType } from '../src/models/ContentType';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function verifyContentTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    console.log('🔍 Verifying content_types collection...');

    // Check collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: 'contenttypes' })
      .toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      console.log('❌ Content types collection not found');
      console.log(
        'Available collections:',
        (await mongoose.connection.db.listCollections().toArray()).map(c => c.name)
      );
      return;
    }

    console.log('✅ Content types collection exists (as "contenttypes")');

    // Check documents count
    const documentCount = await ContentType.countDocuments();
    console.log(`📊 Collection info:`);
    console.log(`   Documents: ${documentCount}`);

    // Check documents
    const contentTypes = await ContentType.find().sort({ order: 1 });
    console.log(`\n📋 Content Types (${contentTypes.length}):`);

    for (const ct of contentTypes) {
      console.log(`   ${ct.order}. ${ct.name}`);
      console.log(`      Code: ${ct.code}`);
      console.log(`      Slug: ${ct.slug}`);
      console.log(`      Active: ${ct.isActive}`);
      console.log(`      Created: ${ct.createdAt.toISOString()}`);
      console.log(`      Updated: ${ct.updatedAt.toISOString()}`);
      console.log('');
    }

    // Check indexes using both methods
    console.log('🗂️  Checking indexes...');

    // Method 1: Using Mongoose collection
    const indexes1 = await ContentType.collection.getIndexes();
    console.log(`\nMethod 1 - Mongoose getIndexes() [${Object.keys(indexes1).length}]:`);
    for (const [name, index] of Object.entries(indexes1)) {
      console.log(`   - ${name}: ${JSON.stringify(index)}`);
    }

    // Method 2: Using MongoDB native driver
    const indexes2 = await mongoose.connection.db.collection('contenttypes').indexes();
    console.log(`\nMethod 2 - MongoDB native indexes() [${indexes2.length}]:`);
    for (const index of indexes2) {
      const unique = index.unique ? ' (UNIQUE)' : '';
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}${unique}`);
    }

    // Test unique constraints
    console.log('\n🧪 Testing unique constraints...');

    try {
      // Try to insert duplicate code
      await ContentType.create({
        code: 'stotra', // Duplicate code
        name: 'Duplicate Stotra',
        slug: 'duplicate-stotra',
        order: 99,
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
      // Try to insert duplicate slug
      await ContentType.create({
        code: 'duplicate',
        name: 'Duplicate Articles',
        slug: 'articles', // Duplicate slug
        order: 99,
      });
      console.log('❌ Unique constraint on slug field NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint on slug field is working');
      } else {
        console.log('⚠️  Unexpected error testing slug uniqueness:', error.message);
      }
    }

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contenttypes (Mongoose auto-pluralized)`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

verifyContentTypes();
