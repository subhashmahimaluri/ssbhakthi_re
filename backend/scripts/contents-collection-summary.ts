#!/usr/bin/env tsx

/**
 * Contents Collection Summary and Usage Examples
 * Demonstrates all features of the multilingual contents collection
 *
 * Usage: npx tsx scripts/contents-collection-summary.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function showContentsSummary() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    const contentsCollection = db.collection('contents');

    console.log('📊 CONTENTS COLLECTION SUMMARY');
    console.log('='.repeat(50));

    // Show collection info
    const totalDocs = await contentsCollection.countDocuments();
    const indexes = await contentsCollection.indexes();

    console.log(`\n🗂️  Collection Information:`);
    console.log(`   Name: contents`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Documents: ${totalDocs}`);
    console.log(
      `   Indexes: ${indexes.length} (${indexes.filter(i => i.unique).length} unique, ${indexes.filter(i => i.partialFilterExpression).length} partial)`
    );

    // Show schema features
    console.log(`\n🔧 Schema Features:`);
    console.log(`   ✅ JSON Schema validation with strict typing`);
    console.log(`   ✅ Multilingual support (en, te, hi, kn)`);
    console.log(`   ✅ Content types: stotra, article`);
    console.log(`   ✅ Status: draft, published`);
    console.log(`   ✅ Hierarchical categories by taxonomy`);
    console.log(`   ✅ Per-language unique slugs and paths (partial indexes)`);
    console.log(`   ✅ Full-text search on English title/seoTitle`);

    // Show indexes
    console.log(`\n🗂️  Index Structure:`);
    const uniqueIndexes = indexes.filter(i => i.unique);
    const partialIndexes = indexes.filter(i => i.partialFilterExpression);

    console.log(`\n   Unique Indexes (${uniqueIndexes.length}):`);
    for (const index of uniqueIndexes) {
      const partial = index.partialFilterExpression ? ' (partial)' : '';
      console.log(`     - ${JSON.stringify(index.key)}${partial}`);
    }

    console.log(`\n   Query Indexes (${indexes.length - uniqueIndexes.length}):`);
    for (const index of indexes) {
      if (!index.unique && index.name !== '_id_') {
        console.log(`     - ${JSON.stringify(index.key)}`);
      }
    }

    // Show documents
    if (totalDocs > 0) {
      console.log(`\n📋 Sample Documents:`);

      const docs = await contentsCollection.find({}).toArray();
      for (const doc of docs) {
        console.log(`\n   📄 ${doc.contentType.toUpperCase()}: ${doc.canonicalSlug}`);
        console.log(`      Status: ${doc.status}`);
        console.log(`      Languages: ${Object.keys(doc.translations).join(', ')}`);
        console.log(
          `      Categories: ${doc.categories.typeIds.length + doc.categories.devaIds.length + doc.categories.byNumberIds.length} total`
        );

        // Show paths for each language
        for (const [lang, translation] of Object.entries(doc.translations as any)) {
          console.log(`      ${lang.toUpperCase()}: ${translation.path} (${translation.slug})`);
        }
      }
    }

    // Show usage examples
    console.log(`\n💡 USAGE EXAMPLES`);
    console.log('='.repeat(50));

    console.log(`\n1. INSERT NEW STOTRA (English only):`);
    console.log(`   db.contents.insertOne({`);
    console.log(`     contentType: "stotra",`);
    console.log(`     canonicalSlug: "hanuman-chalisa",`);
    console.log(`     categories: {`);
    console.log(`       typeIds: [ObjectId("...")],`);
    console.log(`       devaIds: [ObjectId("...")],`);
    console.log(`       byNumberIds: []`);
    console.log(`     },`);
    console.log(`     imageUrl: null,`);
    console.log(`     status: "published",`);
    console.log(`     translations: {`);
    console.log(`       en: {`);
    console.log(`         title: "Hanuman Chalisa",`);
    console.log(`         seoTitle: "Hanuman Chalisa - Complete Hymn",`);
    console.log(`         youtubeUrl: null,`);
    console.log(`         slug: "hanuman-chalisa",`);
    console.log(`         path: "/en/stotra/hanuman/hanuman-chalisa",`);
    console.log(`         stotra: "<p>Stotra text here...</p>",`);
    console.log(`         stotraMeaning: "<p>Meaning here...</p>",`);
    console.log(`         body: null`);
    console.log(`       }`);
    console.log(`     },`);
    console.log(`     createdAt: new Date(),`);
    console.log(`     updatedAt: new Date()`);
    console.log(`   })`);

    console.log(`\n2. ADD TELUGU TRANSLATION (language-only update):`);
    console.log(`   db.contents.updateOne(`);
    console.log(`     { canonicalSlug: "hanuman-chalisa" },`);
    console.log(`     {`);
    console.log(`       $set: {`);
    console.log(`         "translations.te": {`);
    console.log(`           title: "హనుమాన్ చాలీసా",`);
    console.log(`           seoTitle: "హనుమాన్ చాలీసా - పూర్ణ స్తోత్రం",`);
    console.log(`           youtubeUrl: null,`);
    console.log(`           slug: "హనుమాన్-చాలీసా",`);
    console.log(`           path: "/te/stotra/hanuman/హనుమాన్-చాలీసా",`);
    console.log(`           stotra: "<p>తెలుగు స్తోత్రం...</p>",`);
    console.log(`           stotraMeaning: "<p>అర్థం...</p>",`);
    console.log(`           body: null`);
    console.log(`         },`);
    console.log(`         updatedAt: new Date()`);
    console.log(`       }`);
    console.log(`     }`);
    console.log(`   )`);

    console.log(`\n3. UPDATE SPECIFIC ENGLISH FIELDS:`);
    console.log(`   db.contents.updateOne(`);
    console.log(`     { canonicalSlug: "hanuman-chalisa" },`);
    console.log(`     {`);
    console.log(`       $set: {`);
    console.log(`         "translations.en.youtubeUrl": "https://youtube.com/...",`);
    console.log(`         "translations.en.seoTitle": "Updated SEO Title",`);
    console.log(`         updatedAt: new Date()`);
    console.log(`       }`);
    console.log(`     }`);
    console.log(`   )`);

    console.log(`\n4. INSERT ARTICLE:`);
    console.log(`   db.contents.insertOne({`);
    console.log(`     contentType: "article",`);
    console.log(`     canonicalSlug: "temple-traditions",`);
    console.log(`     categories: {`);
    console.log(`       typeIds: [ObjectId("...")],`);
    console.log(`       devaIds: [],`);
    console.log(`       byNumberIds: []`);
    console.log(`     },`);
    console.log(`     imageUrl: "https://example.com/image.jpg",`);
    console.log(`     status: "draft",`);
    console.log(`     translations: {`);
    console.log(`       en: {`);
    console.log(`         title: "Temple Traditions",`);
    console.log(`         seoTitle: "Understanding Hindu Temple Traditions",`);
    console.log(`         youtubeUrl: null,`);
    console.log(`         slug: "temple-traditions",`);
    console.log(`         path: "/en/articles/temple-traditions",`);
    console.log(`         stotra: null,`);
    console.log(`         stotraMeaning: null,`);
    console.log(`         body: "<p>Article content here...</p>"`);
    console.log(`       }`);
    console.log(`     },`);
    console.log(`     createdAt: new Date(),`);
    console.log(`     updatedAt: new Date()`);
    console.log(`   })`);

    console.log(`\n🔍 QUERY EXAMPLES`);
    console.log('='.repeat(50));

    console.log(`\n1. Find all published Stotras:`);
    console.log(`   db.contents.find({`);
    console.log(`     contentType: "stotra",`);
    console.log(`     status: "published"`);
    console.log(`   })`);

    console.log(`\n2. Find content by English slug:`);
    console.log(`   db.contents.findOne({`);
    console.log(`     "translations.en.slug": "shiva-tandava-stotra"`);
    console.log(`   })`);

    console.log(`\n3. Find content by Telugu path:`);
    console.log(`   db.contents.findOne({`);
    console.log(`     "translations.te.path": "/te/stotra/shiva/శివ-తాండవ-స్తోత్రం"`);
    console.log(`   })`);

    console.log(`\n4. Find content by category:`);
    console.log(`   db.contents.find({`);
    console.log(`     "categories.devaIds": ObjectId("...")`);
    console.log(`   })`);

    console.log(`\n5. Full-text search (English only):`);
    console.log(`   db.contents.find({`);
    console.log(`     $text: { $search: "Shiva dance" }`);
    console.log(`   })`);

    console.log(`\n6. Find content with specific language:`);
    console.log(`   db.contents.find({`);
    console.log(`     "translations.te": { $exists: true }`);
    console.log(`   })`);

    console.log(`\n✨ KEY BENEFITS`);
    console.log('='.repeat(50));
    console.log(`   🌐 Multilingual content in single document`);
    console.log(`   🔒 JSON Schema validation ensures data integrity`);
    console.log(`   🚀 Partial unique indexes prevent language conflicts`);
    console.log(`   🎯 Language-specific URL routing (/en/..., /te/...)`);
    console.log(`   📊 Efficient querying with proper indexing`);
    console.log(`   🔄 Easy content translation workflow`);
    console.log(`   📚 Support for both Stotras and Articles`);
    console.log(`   🏷️ Hierarchical categorization system`);

    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contents`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

showContentsSummary();
