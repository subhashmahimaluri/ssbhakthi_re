#!/usr/bin/env tsx

/**
 * Fix MongoDB schema to allow imageUrl in translation properties
 */

import mongoose from 'mongoose';

const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function fixImageUrlSchema() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db!;
    const collection = db.collection('contents');

    console.log('📋 Current schema validation...');
    const collections = await db.listCollections({ name: 'contents' }).toArray();

    if (collections.length > 0) {
      console.log('Collection found. Updating schema...');

      // Update the validator to include imageUrl in translation properties
      await db.command({
        collMod: 'contents',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: [
              'contentType',
              'canonicalSlug',
              'categories',
              'translations',
              'status',
              'createdAt',
              'updatedAt',
            ],
            properties: {
              contentType: { enum: ['stotra', 'article'] },
              canonicalSlug: { bsonType: 'string', minLength: 1 },
              categories: {
                bsonType: 'object',
                required: ['typeIds', 'devaIds', 'byNumberIds'],
                properties: {
                  typeIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
                  devaIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
                  byNumberIds: { bsonType: 'array', items: { bsonType: 'objectId' } },
                },
                additionalProperties: false,
              },
              imageUrl: { bsonType: ['string', 'null'] },
              status: { enum: ['draft', 'published'] },
              translations: {
                bsonType: 'object',
                patternProperties: {
                  '^(en|te|hi|kn)$': {
                    bsonType: 'object',
                    required: ['title', 'slug', 'path'],
                    properties: {
                      title: { bsonType: 'string', minLength: 1 },
                      seoTitle: { bsonType: ['string', 'null'] },
                      summary: { bsonType: ['string', 'null'] },
                      videoId: { bsonType: ['string', 'null'] },
                      imageUrl: { bsonType: ['string', 'null'] }, // ✅ Added this field
                      youtubeUrl: { bsonType: ['string', 'null'] },
                      slug: { bsonType: 'string', minLength: 1 },
                      path: { bsonType: 'string', minLength: 1 },
                      // Stotra fields
                      stotra: { bsonType: ['string', 'null'] },
                      stotraMeaning: { bsonType: ['string', 'null'] },
                      // Article field
                      body: { bsonType: ['string', 'null'] },
                    },
                    additionalProperties: false,
                  },
                },
                additionalProperties: false,
              },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' },
              _id: { bsonType: 'objectId' },
            },
            additionalProperties: false,
          },
        },
      });

      console.log('✅ MongoDB schema updated successfully!');
      console.log('   - Added imageUrl field to translation properties');
      console.log('   - Added summary and videoId fields for compatibility');
    } else {
      console.log('❌ No validator found for contents collection');
    }
  } catch (error) {
    console.error('❌ Error updating schema:', (error as Error).message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

fixImageUrlSchema();
