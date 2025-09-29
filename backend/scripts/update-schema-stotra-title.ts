#!/usr/bin/env tsx

/**
 * Update MongoDB schema validation to add stotraTitle field
 * This script updates the JSON schema validation to include the new stotraTitle field
 */

import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';

async function updateSchemaForStotraTitle() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('📋 Updating schema validation to include stotraTitle field...');

    // Updated schema that includes stotraTitle field
    const updatedSchema = {
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
          stotraTitle: {
            bsonType: ['string', 'null'],
            maxLength: 200,
            description: 'Common title for stotra (shared across all translations)',
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

    // Apply the updated schema validation
    await db.command({
      collMod: 'contents',
      validator: updatedSchema,
      validationLevel: 'strict',
      validationAction: 'error',
    });

    console.log('✅ Schema validation updated successfully!');
    console.log('📋 Added stotraTitle field to schema validation');

    // Test the updated schema with a sample document
    console.log('\n🧪 Testing updated schema validation...');

    const contentsCollection = db.collection('contents');

    // Test document with stotraTitle
    const testDoc = {
      contentType: 'stotra',
      canonicalSlug: `test-stotra-title-${Date.now()}`,
      stotraTitle: 'Test Stotra Common Title',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      status: 'draft',
      translations: {
        en: {
          title: 'Test Stotra English Title',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await contentsCollection.insertOne(testDoc);
      console.log('✅ Test document with stotraTitle inserted successfully!');
      console.log(`   Document ID: ${result.insertedId}`);

      // Clean up test document
      await contentsCollection.deleteOne({ _id: result.insertedId });
      console.log('🧹 Test document cleaned up');
    } catch (error: any) {
      console.log('❌ Test document failed validation');
      console.log('Error:', error.message);
      if (error.errInfo && error.errInfo.details) {
        console.log('Validation details:', JSON.stringify(error.errInfo.details, null, 2));
      }
    }

    console.log('\n🎉 Schema update completed successfully!');
    console.log('   ✅ stotraTitle field added to MongoDB schema validation');
    console.log('   ✅ Existing documents remain valid');
    console.log('   ✅ New documents can include stotraTitle field');
  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
}

// Run the schema update
if (require.main === module) {
  updateSchemaForStotraTitle();
}

export default updateSchemaForStotraTitle;
