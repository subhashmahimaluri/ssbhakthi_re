#!/usr/bin/env node

/**
 * Migration script to add seoDescription and seoKeywords fields to existing content
 * This script adds the missing SEO fields to the database schema and ensures compatibility
 */

const mongoose = require('mongoose');

async function addSeoFieldsMigration() {
  console.log('🚀 Starting SEO fields migration...');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssbhakthi';

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const contentsCollection = db.collection('contents');

    // Step 1: Count documents that need migration
    const documentsToMigrate = await contentsCollection.countDocuments({
      $or: [
        { 'translations.en.seoDescription': { $exists: false } },
        { 'translations.te.seoDescription': { $exists: false } },
        { 'translations.hi.seoDescription': { $exists: false } },
        { 'translations.kn.seoDescription': { $exists: false } },
        { 'translations.en.seoKeywords': { $exists: false } },
        { 'translations.te.seoKeywords': { $exists: false } },
        { 'translations.hi.seoKeywords': { $exists: false } },
        { 'translations.kn.seoKeywords': { $exists: false } },
      ],
    });

    console.log(`📊 Found ${documentsToMigrate} documents that may need SEO fields migration`);

    if (documentsToMigrate === 0) {
      console.log('✅ No documents need migration - all SEO fields are already present');
      return;
    }

    // Step 2: Get all documents to migrate
    const documents = await contentsCollection.find({}).toArray();

    let updatedCount = 0;
    let errorCount = 0;

    console.log(`🔄 Processing ${documents.length} documents...`);

    for (const doc of documents) {
      try {
        let hasChanges = false;
        const updatedTranslations = {};

        // Process each translation
        for (const [langCode, translation] of Object.entries(doc.translations || {})) {
          // Copy all existing fields
          const updatedTranslation = { ...translation };

          // Add missing SEO fields if they don't exist
          if (!('seoDescription' in translation)) {
            updatedTranslation.seoDescription = null;
            hasChanges = true;
          }

          if (!('seoKeywords' in translation)) {
            updatedTranslation.seoKeywords = null;
            hasChanges = true;
          }

          updatedTranslations[langCode] = updatedTranslation;
        }

        // Only update if there are changes
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

          updatedCount++;
          console.log(`✅ Updated document: ${doc.canonicalSlug} (${doc.contentType})`);
        }
      } catch (error) {
        console.error(`❌ Error updating document ${doc.canonicalSlug}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`✅ Successfully updated: ${updatedCount} documents`);
    console.log(`❌ Errors: ${errorCount} documents`);
    console.log(`📝 Total processed: ${documents.length} documents`);

    // Step 3: Update the JSON Schema to include the new fields
    console.log(`\n🔧 Updating JSON Schema validation...`);

    try {
      const schema = {
        $jsonSchema: {
          bsonType: 'object',
          required: ['contentType', 'canonicalSlug', 'categories', 'status', 'translations'],
          additionalProperties: false,
          properties: {
            _id: {
              bsonType: 'objectId',
            },
            contentType: {
              bsonType: 'string',
              enum: ['stotra', 'article'],
              description: 'Type of content',
            },
            canonicalSlug: {
              bsonType: 'string',
              pattern: '^[a-z0-9-]+$',
              minLength: 1,
              maxLength: 150,
              description: 'Unique URL-friendly identifier',
            },
            stotraTitle: {
              bsonType: ['string', 'null'],
              maxLength: 200,
              description: 'Common stotra title (for stotra content type)',
            },
            articleTitle: {
              bsonType: ['string', 'null'],
              maxLength: 200,
              description: 'Common article title (for article content type)',
            },
            categories: {
              bsonType: 'object',
              additionalProperties: false,
              properties: {
                typeIds: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'objectId',
                  },
                },
                devaIds: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'objectId',
                  },
                },
                byNumberIds: {
                  bsonType: 'array',
                  items: {
                    bsonType: 'objectId',
                  },
                },
              },
            },
            imageUrl: {
              bsonType: ['string', 'null'],
              description: 'Global image URL for the content',
            },
            status: {
              bsonType: 'string',
              enum: ['draft', 'published'],
              description: 'Publication status',
            },
            translations: {
              bsonType: 'object',
              minProperties: 1,
              additionalProperties: {
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
                  seoDescription: {
                    bsonType: ['string', 'null'],
                    maxLength: 500,
                    description: 'SEO meta description',
                  },
                  seoKeywords: {
                    bsonType: ['string', 'null'],
                    maxLength: 500,
                    description: 'SEO keywords',
                  },
                  summary: {
                    bsonType: ['string', 'null'],
                    maxLength: 500,
                    description: 'Content summary or brief description',
                  },
                  videoId: {
                    bsonType: ['string', 'null'],
                    pattern: '^[a-zA-Z0-9_-]{11}$',
                    description: 'YouTube video ID (11 characters)',
                  },
                  imageUrl: {
                    bsonType: ['string', 'null'],
                    description: 'Language-specific image URL',
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
        validator: schema,
        validationLevel: 'moderate',
        validationAction: 'warn',
      });

      console.log('✅ JSON Schema validation updated successfully');
    } catch (schemaError) {
      console.error('⚠️ Warning: Could not update JSON Schema validation:', schemaError);
      console.log('   This is not critical - the migration data updates were successful');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Execute migration if run directly
if (require.main === module) {
  addSeoFieldsMigration()
    .then(() => {
      console.log('🎉 SEO fields migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addSeoFieldsMigration };
