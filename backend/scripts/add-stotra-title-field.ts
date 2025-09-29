#!/usr/bin/env ts-node

/**
 * Migration script to add stotraTitle field to existing stotra documents
 * This script adds the new stotraTitle field to all existing stotra documents in the database
 */

import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';
import { Content } from '../src/models/Content';

async function addStotraTitleField() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database');

    console.log('🔍 Finding stotra documents without stotraTitle field...');

    // Find all stotra documents that don't have stotraTitle field
    const stotras = await Content.find({
      contentType: 'stotra',
      stotraTitle: { $exists: false },
    });

    console.log(`📊 Found ${stotras.length} stotra documents to update`);

    if (stotras.length === 0) {
      console.log('✅ All stotra documents already have stotraTitle field');
      return;
    }

    let updated = 0;

    for (const stotra of stotras) {
      try {
        // Try to extract a common title from existing translations
        // Prioritize English title, then fall back to other languages
        let commonTitle = '';

        if (stotra.translations.en?.title) {
          commonTitle = stotra.translations.en.title;
        } else if (stotra.translations.te?.title) {
          commonTitle = stotra.translations.te.title;
        } else if (stotra.translations.hi?.title) {
          commonTitle = stotra.translations.hi.title;
        } else if (stotra.translations.kn?.title) {
          commonTitle = stotra.translations.kn.title;
        } else {
          // If no title found in any language, derive from canonicalSlug
          commonTitle = stotra.canonicalSlug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }

        // Update the document
        await Content.updateOne({ _id: stotra._id }, { $set: { stotraTitle: commonTitle } });

        updated++;
        console.log(`✅ Updated ${stotra.canonicalSlug}: "${commonTitle}"`);
      } catch (error) {
        console.error(`❌ Error updating ${stotra.canonicalSlug}:`, error);
      }
    }

    console.log(`🎉 Migration completed! Updated ${updated} out of ${stotras.length} documents`);

    // Verify the update
    const updatedCount = await Content.countDocuments({
      contentType: 'stotra',
      stotraTitle: { $exists: true, $ne: null },
    });

    console.log(`📊 Total stotra documents with stotraTitle: ${updatedCount}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  addStotraTitleField();
}

export default addStotraTitleField;
