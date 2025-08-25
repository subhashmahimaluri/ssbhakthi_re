#!/usr/bin/env tsx

/**
 * Insert languages into MongoDB
 * Usage: tsx scripts/insert-languages.ts
 */

import mongoose from 'mongoose';
import { Language } from '../src/models/Language';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

// Language definitions
const languages = [
  {
    code: 'en',
    nativeName: 'English',
    order: 0,
  },
  {
    code: 'te',
    nativeName: 'తెలుగు',
    order: 1,
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    order: 2,
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    order: 3,
  },
];

async function insertLanguages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    console.log('🗑️  Clearing existing languages...');
    await Language.deleteMany({});

    console.log('📦 Processing languages...');

    // Create language documents
    const languageDocs = languages.map(
      lang =>
        new Language({
          code: lang.code,
          nativeName: lang.nativeName,
          order: lang.order,
          isActive: true,
        })
    );

    console.log('💾 Inserting documents...');
    const savedDocs = await Language.insertMany(languageDocs);

    console.log('✅ Languages inserted successfully!');

    // Show summary
    const totalLanguages = await Language.countDocuments();
    const activeLanguages = await Language.countDocuments({ isActive: true });

    console.log(`\n📊 Summary:`);
    console.log(`   Total languages: ${totalLanguages}`);
    console.log(`   Active languages: ${activeLanguages}`);

    console.log(`\n🌍 Languages:`);
    const allLanguages = await Language.find().sort({ order: 1 });
    for (const lang of allLanguages) {
      console.log(`   ${lang.order + 1}. ${lang.nativeName} (${lang.code})`);
    }

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: languages`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

insertLanguages();
