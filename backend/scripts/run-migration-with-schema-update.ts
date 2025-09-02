#!/usr/bin/env tsx

/**
 * Complete Migration Script: Update schema validation and migrate data
 * 1. Remove old schema validation
 * 2. Run data migration
 * 3. Add new schema validation
 */

import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';

async function runCompleteMigration() {
  console.log('🚀 Starting Complete Migration Process...');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const contentsCollection = db.collection('contents');

    // Step 1: Remove schema validation temporarily
    console.log('\n📋 Step 1: Removing schema validation...');
    try {
      await db.command({
        collMod: 'contents',
        validator: {},
        validationLevel: 'off',
      });
      console.log('✅ Schema validation disabled');
    } catch (error) {
      console.log('⚠️  Could not disable validation (may not exist):', error);
    }

    // Step 2: Run data migration
    console.log('\n🔄 Step 2: Migrating data...');
    const documents = await contentsCollection.find({}).toArray();
    console.log(`📊 Found ${documents.length} documents to migrate`);

    let migratedCount = 0;

    for (const doc of documents) {
      try {
        let hasChanges = false;
        const updatedTranslations: any = {};

        // Process each translation
        for (const [langCode, translation] of Object.entries(doc.translations || {})) {
          const originalTranslation = translation as any;
          const updatedTranslation: any = {
            title: originalTranslation.title,
            seoTitle: originalTranslation.seoTitle || null,
          };

          // Convert youtubeUrl to videoId
          if (originalTranslation.youtubeUrl) {
            const videoId = extractYouTubeVideoId(originalTranslation.youtubeUrl);
            if (videoId) {
              updatedTranslation.videoId = videoId;
              hasChanges = true;
              console.log(`   📹 Converted YouTube URL to videoId: ${videoId} (${langCode})`);
            } else {
              console.log(
                `   ⚠️  Invalid YouTube URL, setting videoId to null: ${originalTranslation.youtubeUrl}`
              );
              updatedTranslation.videoId = null;
              hasChanges = true;
            }
          } else {
            updatedTranslation.videoId = null;
          }

          // Keep content fields
          if (originalTranslation.stotra !== undefined) {
            updatedTranslation.stotra = originalTranslation.stotra;
          }
          if (originalTranslation.stotraMeaning !== undefined) {
            updatedTranslation.stotraMeaning = originalTranslation.stotraMeaning;
          }
          if (originalTranslation.body !== undefined) {
            updatedTranslation.body = originalTranslation.body;
          }

          // Check if migration is needed
          if (
            originalTranslation.slug ||
            originalTranslation.path ||
            originalTranslation.youtubeUrl
          ) {
            hasChanges = true;
          }

          updatedTranslations[langCode] = updatedTranslation;
        }

        if (hasChanges) {
          await contentsCollection.updateOne(
            { _id: doc._id },
            {
              $set: {
                translations: updatedTranslations,
                updatedAt: new Date(),
              },
            }
          );

          migratedCount++;
          console.log(`✅ Migrated document: ${doc.canonicalSlug}`);
        }
      } catch (error) {
        console.error(`❌ Error migrating document ${doc.canonicalSlug}:`, error);
      }
    }

    console.log(`\n📊 Migration completed: ${migratedCount} documents migrated`);

    // Step 3: Add new schema validation
    console.log('\n📋 Step 3: Adding new schema validation...');

    const newSchema = {
      $jsonSchema: {
        bsonType: 'object',
        title: 'Contents Collection Schema',
        required: ['contentType', 'canonicalSlug', 'categories', 'status', 'translations'],
        additionalProperties: false,
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          contentType: {
            bsonType: 'string',
            enum: ['stotra', 'article'],
            description: 'Type of content (stotra or article)',
          },
          canonicalSlug: {
            bsonType: 'string',
            pattern: '^[a-z0-9-]+$',
            minLength: 1,
            maxLength: 150,
            description: 'Unique canonical identifier (lowercase, hyphens allowed)',
          },
          categories: {
            bsonType: 'object',
            required: ['typeIds', 'devaIds', 'byNumberIds'],
            additionalProperties: false,
            properties: {
              typeIds: {
                bsonType: 'array',
                items: { bsonType: 'objectId' },
              },
              devaIds: {
                bsonType: 'array',
                items: { bsonType: 'objectId' },
              },
              byNumberIds: {
                bsonType: 'array',
                items: { bsonType: 'objectId' },
              },
            },
          },
          imageUrl: {
            bsonType: ['string', 'null'],
            pattern: '^https?://.*',
            description: 'Optional image URL',
          },
          status: {
            bsonType: 'string',
            enum: ['draft', 'published'],
            description: 'Content status',
          },
          translations: {
            bsonType: 'object',
            minProperties: 1,
            patternProperties: {
              '^(en|te|hi|kn)$': {
                bsonType: 'object',
                required: ['title'],
                additionalProperties: false,
                properties: {
                  title: {
                    bsonType: 'string',
                    minLength: 1,
                    maxLength: 200,
                    description: 'Content title',
                  },
                  seoTitle: {
                    bsonType: ['string', 'null'],
                    maxLength: 300,
                    description: 'SEO optimized title',
                  },
                  videoId: {
                    bsonType: ['string', 'null'],
                    pattern: '^[a-zA-Z0-9_-]{11}$',
                    description: 'YouTube video ID (11 characters)',
                  },
                  stotra: {
                    bsonType: ['string', 'null'],
                    description: 'Stotra content (HTML)',
                  },
                  stotraMeaning: {
                    bsonType: ['string', 'null'],
                    description: 'Stotra meaning (HTML)',
                  },
                  body: {
                    bsonType: ['string', 'null'],
                    description: 'Article body content (HTML)',
                  },
                },
              },
            },
          },
          createdAt: {
            bsonType: 'date',
          },
          updatedAt: {
            bsonType: 'date',
          },
        },
      },
    };

    await db.command({
      collMod: 'contents',
      validator: newSchema,
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('✅ New schema validation applied');

    // Step 4: Verify migration
    console.log('\n🔍 Step 4: Verifying migration...');
    const sampleDoc = await contentsCollection.findOne({});
    if (sampleDoc && sampleDoc.translations) {
      const firstTranslation = Object.values(sampleDoc.translations)[0] as any;
      console.log(`\n📋 Sample migrated translation structure:`);
      console.log(`   - title: ${firstTranslation.title ? '✓' : '✗'}`);
      console.log(`   - seoTitle: ${firstTranslation.seoTitle !== undefined ? '✓' : '✗'}`);
      console.log(`   - videoId: ${firstTranslation.videoId !== undefined ? '✓' : '✗'}`);
      console.log(
        `   - slug: ${firstTranslation.slug !== undefined ? '❌ Still exists!' : '✅ Removed'}`
      );
      console.log(
        `   - path: ${firstTranslation.path !== undefined ? '❌ Still exists!' : '✅ Removed'}`
      );
      console.log(
        `   - youtubeUrl: ${firstTranslation.youtubeUrl !== undefined ? '❌ Still exists!' : '✅ Removed'}`
      );
    }

    console.log(`\n🎉 Complete migration finished successfully!`);
    console.log(`   📊 Documents migrated: ${migratedCount}`);
    console.log(`   📋 Schema validation: Updated`);
    console.log(`   🗂️  Database: Ready for new structure`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }

    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

// Run the complete migration
if (require.main === module) {
  runCompleteMigration();
}

export { runCompleteMigration };
