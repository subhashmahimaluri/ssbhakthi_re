import mongoose from 'mongoose';
import { connectDB } from '../src/config/database';

interface CategoryUpdate {
  canonicalSlug: string;
  before: any;
  after: any;
}

async function fixCategoryObjectIdConsistency() {
  try {
    console.log('🔧 Starting category ObjectId consistency fix...');

    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const contentsCollection = db.collection('contents');

    // Find all stotra documents
    const stotras = await contentsCollection.find({ contentType: 'stotra' }).toArray();
    console.log(`📋 Found ${stotras.length} stotras to check`);

    const updatesNeeded: CategoryUpdate[] = [];
    let fixedCount = 0;

    for (const stotra of stotras) {
      const { canonicalSlug, categories } = stotra;
      let needsUpdate = false;
      const originalCategories = JSON.parse(JSON.stringify(categories));

      // Convert typeIds to ObjectIds
      if (categories.typeIds && Array.isArray(categories.typeIds)) {
        const convertedTypeIds = categories.typeIds.map((id: any) => {
          if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            needsUpdate = true;
            return new mongoose.Types.ObjectId(id);
          }
          return id;
        });
        categories.typeIds = convertedTypeIds;
      }

      // Convert devaIds to ObjectIds
      if (categories.devaIds && Array.isArray(categories.devaIds)) {
        const convertedDevaIds = categories.devaIds.map((id: any) => {
          if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            needsUpdate = true;
            return new mongoose.Types.ObjectId(id);
          }
          return id;
        });
        categories.devaIds = convertedDevaIds;
      }

      // Convert byNumberIds to ObjectIds
      if (categories.byNumberIds && Array.isArray(categories.byNumberIds)) {
        const convertedByNumberIds = categories.byNumberIds.map((id: any) => {
          if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            needsUpdate = true;
            return new mongoose.Types.ObjectId(id);
          }
          return id;
        });
        categories.byNumberIds = convertedByNumberIds;
      }

      if (needsUpdate) {
        updatesNeeded.push({
          canonicalSlug,
          before: originalCategories,
          after: categories,
        });

        // Update the document
        const result = await contentsCollection.updateOne(
          { _id: stotra._id },
          {
            $set: {
              categories: categories,
              updatedAt: new Date(),
            },
          },
          { bypassDocumentValidation: true }
        );

        if (result.modifiedCount > 0) {
          fixedCount++;
          console.log(`✅ Fixed stotra: ${canonicalSlug}`);
        } else {
          console.log(`⚠️ Failed to update stotra: ${canonicalSlug}`);
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`Total stotras checked: ${stotras.length}`);
    console.log(`Stotras needing fixes: ${updatesNeeded.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);

    if (updatesNeeded.length > 0) {
      console.log('\n🔍 Details of fixed stotras:');
      updatesNeeded.forEach((update, index) => {
        console.log(`\n${index + 1}. ${update.canonicalSlug}:`);
        console.log('   Before:', JSON.stringify(update.before, null, 2));
        console.log('   After:', JSON.stringify(update.after, null, 2));
      });
    } else {
      console.log('\n✅ All stotras already have consistent ObjectId formatting!');
    }

    // Verify the fix by checking a few documents
    console.log('\n🔍 Verification check...');
    const sampleStotras = await contentsCollection
      .find({ contentType: 'stotra' })
      .limit(3)
      .toArray();

    for (const stotra of sampleStotras) {
      console.log(`\nSample stotra: ${stotra.canonicalSlug}`);
      console.log(
        'typeIds types:',
        stotra.categories.typeIds.map((id: any) =>
          typeof id === 'object' && id._bsontype === 'ObjectId' ? 'ObjectId' : typeof id
        )
      );
      console.log(
        'devaIds types:',
        stotra.categories.devaIds.map((id: any) =>
          typeof id === 'object' && id._bsontype === 'ObjectId' ? 'ObjectId' : typeof id
        )
      );
      console.log(
        'byNumberIds types:',
        stotra.categories.byNumberIds.map((id: any) =>
          typeof id === 'object' && id._bsontype === 'ObjectId' ? 'ObjectId' : typeof id
        )
      );
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixCategoryObjectIdConsistency()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default fixCategoryObjectIdConsistency;
