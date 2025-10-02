#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { appConfig } from '../src/config/app';
import { Content } from '../src/models/Content';

const CATEGORY_MAPPINGS = {
  // Main category types for stotras
  STOTRA_TYPES: {
    sahasranamam: 'Sahasranamam',
    ashtottara: 'Ashtottara Shatanamavali',
    sahasranamavali: 'Sahasranamavali',
    stotra: 'General Stotras',
  },

  // Deity categories
  DEVA_TYPES: {
    ganesha: 'Ganesha',
    shiva: 'Shiva',
    vishnu: 'Vishnu',
    devi: 'Devi',
    hanuman: 'Hanuman',
    krishna: 'Krishna',
    rama: 'Rama',
  },
};

async function setupSearchIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(appConfig.mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Drop existing text search index if it exists
    try {
      await Content.collection.dropIndex('content_text_search');
      console.log('🗑️  Dropped existing text search index');
    } catch (error) {
      console.log('ℹ️  No existing text search index to drop');
    }

    // Create the comprehensive text search index
    console.log('Creating text search index...');
    await Content.collection.createIndex(
      {
        'translations.en.title': 'text',
        'translations.te.title': 'text',
        'translations.hi.title': 'text',
        'translations.kn.title': 'text',
        'translations.en.stotra': 'text',
        'translations.te.stotra': 'text',
        'translations.hi.stotra': 'text',
        'translations.kn.stotra': 'text',
        'translations.en.body': 'text',
        'translations.te.body': 'text',
        'translations.hi.body': 'text',
        'translations.kn.body': 'text',
        stotraTitle: 'text',
      },
      {
        name: 'content_text_search',
        weights: {
          'translations.en.title': 10,
          'translations.te.title': 10,
          'translations.hi.title': 10,
          'translations.kn.title': 10,
          stotraTitle: 10,
          'translations.en.stotra': 5,
          'translations.te.stotra': 5,
          'translations.hi.stotra': 5,
          'translations.kn.stotra': 5,
          'translations.en.body': 3,
          'translations.te.body': 3,
          'translations.hi.body': 3,
          'translations.kn.body': 3,
        },
      }
    );
    console.log('✅ Created comprehensive text search index');

    // Create additional indexes for performance
    const indexes = [
      { contentType: 1, status: 1 },
      { 'categories.typeIds': 1 },
      { 'categories.devaIds': 1 },
      { 'categories.byNumberIds': 1 },
      { status: 1, updatedAt: -1 },
      { canonicalSlug: 1, status: 1 },
    ];

    for (const index of indexes) {
      try {
        await Content.collection.createIndex(index as any);
        console.log(`✅ Created index: ${JSON.stringify(index)}`);
      } catch (error: any) {
        if (error.code === 85) {
          console.log(`ℹ️  Index already exists: ${JSON.stringify(index)}`);
        } else {
          console.error(`❌ Failed to create index ${JSON.stringify(index)}:`, error.message);
        }
      }
    }

    // Check if we have any content to verify indexes work
    const contentCount = await Content.countDocuments({});
    console.log(`📊 Total content documents: ${contentCount}`);

    if (contentCount > 0) {
      // Test text search
      const searchTest = await Content.find({
        $text: { $search: 'ganesha' },
      }).limit(1);
      console.log(`🔍 Test search for 'ganesha' found ${searchTest.length} results`);
    }

    console.log('🎉 Search indexes setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up search indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSearchIndexes();
}

export default setupSearchIndexes;
