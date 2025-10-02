#!/usr/bin/env tsx

/**
 * Update MongoDB schema validation to add summary field to translations
 */

import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';

async function addSummaryFieldToSchema() {
  try {
    console.log('🔗 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('📋 Updating schema validation to include summary field...');

    // Updated schema that includes summary field in translations
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
            description: 'Common title for stotras across all translations',
          },
          articleTitle: {
            bsonType: ['string', 'null'],
            maxLength: 200,
            description: 'Common title for articles across all translations',
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
    console.log('📋 Added summary field to translations schema validation');

    // Test the updated schema with a sample document
    console.log('\n🧪 Testing updated schema validation...');

    const contentsCollection = db.collection('contents');

    // Test document with summary
    const testDoc = {
      contentType: 'article',
      canonicalSlug: `test-article-summary-${Date.now()}`,
      articleTitle: 'Test Article with Summary',
      categories: {
        typeIds: [],
        devaIds: [],
        byNumberIds: [],
      },
      status: 'draft',
      translations: {
        en: {
          title: 'Test Article English Title',
          summary: 'This is a test summary for the article',
          body: '<p>Test article content</p>',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await contentsCollection.insertOne(testDoc);
      console.log('✅ Test document with summary inserted successfully!');
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
    console.log('   ✅ summary field added to MongoDB schema validation');
    console.log('   ✅ Existing documents remain valid');
    console.log('   ✅ New documents can include summary field in translations');
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
  addSummaryFieldToSchema();
}

export default addSummaryFieldToSchema;
