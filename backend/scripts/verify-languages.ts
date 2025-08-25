#!/usr/bin/env tsx

/**
 * Verify languages collection in MongoDB
 * Usage: tsx scripts/verify-languages.ts
 */

import mongoose from 'mongoose';
import { Language } from '../src/models/Language';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function verifyLanguages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    console.log('🔍 Verifying languages collection...');

    // Check collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const languagesCollection = collections.find(col => col.name === 'languages');

    if (!languagesCollection) {
      console.log('❌ Languages collection not found');
      return;
    }

    console.log('✅ Languages collection exists');

    // Check documents
    const languages = await Language.find().sort({ order: 1 });
    console.log(`📊 Found ${languages.length} languages:`);

    for (const lang of languages) {
      console.log(
        `   ${lang.order + 1}. ${lang.nativeName} (${lang.code}) - Active: ${lang.isActive}`
      );
      console.log(`      Created: ${lang.createdAt.toISOString()}`);
      console.log(`      Updated: ${lang.updatedAt.toISOString()}`);
    }

    // Check indexes
    const indexes = await Language.collection.getIndexes();
    console.log(`\n🗂️  Indexes (${Object.keys(indexes).length}):`);
    for (const [name, index] of Object.entries(indexes)) {
      console.log(`   - ${name}: ${JSON.stringify(index)}`);
    }

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: languages`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

verifyLanguages();
