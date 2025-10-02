#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { appConfig } from '../src/config/app';
import { Content } from '../src/models/Content';

async function dropExistingTextIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(appConfig.mongoUrl);
    console.log('✅ Connected to MongoDB');

    // Get all indexes
    const indexes = await Content.collection.listIndexes().toArray();
    console.log('📋 Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name} - ${JSON.stringify(index.key)}`);
    });

    // Drop all text indexes
    for (const index of indexes) {
      if (index.key && index.key._fts === 'text') {
        try {
          await Content.collection.dropIndex(index.name);
          console.log(`🗑️  Dropped text index: ${index.name}`);
        } catch (error: any) {
          console.log(`⚠️  Could not drop index ${index.name}: ${error.message}`);
        }
      }
    }

    console.log('🎉 Text indexes cleanup completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the cleanup
dropExistingTextIndexes();
