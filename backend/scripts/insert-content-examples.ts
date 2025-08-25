#!/usr/bin/env tsx

/**
 * Insert example documents into contents collection
 * - Demonstrates Stotra and Article document structure
 * - Shows language-only update operations
 *
 * Usage: npx tsx scripts/insert-content-examples.ts
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URL = 'mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin';

async function insertContentExamples() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);

    const db = mongoose.connection.db;
    const contentsCollection = db.collection('contents');
    const categoriesCollection = db.collection('categories');

    // Helper function to resolve category ids (taxonomy + slug)
    async function getCategoryId(taxonomy: string, slug: string) {
      const category = await categoriesCollection.findOne({
        'meta.taxonomy': taxonomy,
        'slug.en': slug,
      });
      if (!category) {
        console.log(`⚠️  Category not found: ${taxonomy}/${slug}, using null`);
        return null;
      }
      return category._id;
    }

    console.log('🔍 Resolving category references...');

    // Get category IDs
    const stotraTypeId = await getCategoryId('type', 'stotra-generic');
    const shivaDevaId = await getCategoryId('deva', 'shiva');
    const suprabhatTypeId = await getCategoryId('type', 'suprabhata');

    console.log('💾 Inserting example documents...');

    const now = new Date();

    // Clear existing example documents
    await contentsCollection.deleteMany({
      canonicalSlug: { $in: ['shiva-tandava-stotra', 'meaning-of-suprabhata-traditions'] },
    });

    // 1) Sample STOTRA (EN only first)
    const stotraDoc = {
      contentType: 'stotra',
      canonicalSlug: 'shiva-tandava-stotra',
      categories: {
        typeIds: stotraTypeId ? [stotraTypeId] : [],
        devaIds: shivaDevaId ? [shivaDevaId] : [],
        byNumberIds: [],
      },
      imageUrl: null,
      status: 'published',
      translations: {
        en: {
          title: 'Shiva Tandava Stotra',
          seoTitle: 'Shiva Tandava Stotra — Hymn of Shiva',
          youtubeUrl: null,
          slug: 'shiva-tandava-stotra',
          path: '/en/stotra/shiva/shiva-tandava-stotra',
          stotra:
            '<p>Jatatavigalajjala pravatapavitasthale<br/>Galeavalambya lambitam bhujagatrayasya<br/>Dhagaddagaddagajjvalallalata pattapavake<br/>Kishora chandrashekhare ratih pratikshanam mama</p>',
          stotraMeaning:
            '<p>A hymn describing the cosmic dance of Shiva, celebrating his divine attributes and the beauty of his eternal dance that maintains the rhythm of the universe.</p>',
          body: null,
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    const insertedStotra = await contentsCollection.insertOne(stotraDoc);
    console.log('✅ Inserted sample Stotra document');

    // 2) Sample ARTICLE (EN only first)
    const articleDoc = {
      contentType: 'article',
      canonicalSlug: 'meaning-of-suprabhata-traditions',
      categories: {
        typeIds: suprabhatTypeId ? [suprabhatTypeId] : [],
        devaIds: [],
        byNumberIds: [],
      },
      imageUrl: null,
      status: 'draft',
      translations: {
        en: {
          title: 'Meaning of Suprabhata Traditions',
          seoTitle: 'Suprabhata: Origins and Practice',
          youtubeUrl: null,
          slug: 'meaning-of-suprabhata-traditions',
          path: '/en/articles/meaning-of-suprabhata-traditions',
          stotra: null,
          stotraMeaning: null,
          body: '<p>Suprabhata is traditionally sung at dawn to awaken the deity in temples. This practice has deep spiritual significance in Hindu traditions, representing the awakening of consciousness and the beginning of a new day filled with divine blessings.</p><p>The tradition varies across different regions and deities, but the core purpose remains the same - to invoke the divine presence and seek blessings for the day ahead.</p>',
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    const insertedArticle = await contentsCollection.insertOne(articleDoc);
    console.log('✅ Inserted sample Article document');

    console.log('\n🧪 Demonstrating language-only updates...');

    // 3) Language-only UPDATE examples

    // Add Telugu translation for the Stotra (only language block changes)
    const teluguUpdate = await contentsCollection.updateOne(
      { canonicalSlug: 'shiva-tandava-stotra' },
      {
        $set: {
          'translations.te': {
            title: 'శివ తాండవ స్తోత్రం',
            seoTitle: 'శివ తాండవ స్తోత్రం — శివుని స్తుతి',
            youtubeUrl: null,
            slug: 'శివ-తాండవ-స్తోత్రం',
            path: '/te/stotra/shiva/శివ-తాండవ-స్తోత్రం',
            stotra:
              '<p>జటాటావిగలజ్జల ప్రవతపవితస్థలే<br/>గలేవలంబ్య లంబితం భుజగత్రయస్య<br/>ధగద్దగద్దగజ్జ్వలల్లలాట పట్టపావకే<br/>కిశోర చంద్రశేఖరే రతిః ప్రతిక్షణం మమ</p>',
            stotraMeaning:
              '<p>శివుని కాస్మిక్ నృత్యాన్ని వర్ణించే స్తోత్రం, అతని దివ్య గుణాలను మరియు విశ్వ లయకు తాళం వేసే అతని శాశ్వత నృత్య సౌందర్యాన్ని కీర్తిస్తుంది.</p>',
            body: null,
          },
          updatedAt: new Date(),
        },
      }
    );
    console.log('✅ Added Telugu translation to Stotra');

    // Add Hindi translation for the Stotra
    const hindiUpdate = await contentsCollection.updateOne(
      { canonicalSlug: 'shiva-tandava-stotra' },
      {
        $set: {
          'translations.hi': {
            title: 'शिव तांडव स्तोत्र',
            seoTitle: 'शिव तांडव स्तोत्र — शिव की स्तुति',
            youtubeUrl: null,
            slug: 'शिव-तांडव-स्तोत्र',
            path: '/hi/stotra/shiva/शिव-तांडव-स्तोत्र',
            stotra:
              '<p>जटाटावीगलज्जल प्रवतपवितस्थले<br/>गलेअवलम्ब्य लम्बितं भुजगत्रयस्य<br/>धगद्धगद्धगज्ज्वलल्ललाट पट्टपावके<br/>किशोर चन्द्रशेखरे रतिः प्रतिक्षणं मम</p>',
            stotraMeaning:
              '<p>शिव के कॉस्मिक नृत्य का वर्णन करने वाला स्तोत्र, उनके दिव्य गुणों और ब्रह्मांड की लय बनाए रखने वाले उनके शाश्वत नृत्य की सुंदरता का गुणगान करता है।</p>',
            body: null,
          },
          updatedAt: new Date(),
        },
      }
    );
    console.log('✅ Added Hindi translation to Stotra');

    // Update only specific EN fields of Article (demonstrating partial field updates)
    const englishFieldUpdate = await contentsCollection.updateOne(
      { canonicalSlug: 'meaning-of-suprabhata-traditions' },
      {
        $set: {
          'translations.en.title': 'Suprabhata: Meaning and Tradition',
          'translations.en.youtubeUrl': 'https://youtube.com/sample-suprabhata-video',
          'translations.en.seoTitle': 'Suprabhata Meaning & Practice - Hindu Dawn Prayers',
          updatedAt: new Date(),
        },
      }
    );
    console.log('✅ Updated specific English fields of Article');

    // Add Telugu translation for the Article
    const articleTeluguUpdate = await contentsCollection.updateOne(
      { canonicalSlug: 'meaning-of-suprabhata-traditions' },
      {
        $set: {
          'translations.te': {
            title: 'సుప్రభాత సంప్రదాయాల అర్థం',
            seoTitle: 'సుప్రభాత: మూలాలు మరియు అభ్యాసం',
            youtubeUrl: null,
            slug: 'సుప్రభాత-సంప్రదాయాల-అర్థం',
            path: '/te/articles/సుప్రభాత-సంప్రదాయాల-అర్థం',
            stotra: null,
            stotraMeaning: null,
            body: '<p>సుప్రభాతం సాంప్రదాయికంగా ఆలయాలలో దేవతలను మేల్కొలపడానికి తెల్లవారుజామున పాడబడుతుంది. ఈ అభ్యాసం హిందూ సంప్రదాయాలలో లోతైన ఆధ్యాత్మిక ప్రాముఖ్యతను కలిగి ఉంది, ఇది చైతన్యం యొక్క మేల్కొలుపు మరియు దైవిక ఆశీర్వాదాలతో నిండిన కొత్త రోజు యొక్క ప్రారంభాన్ని సూచిస్తుంది.</p>',
          },
          updatedAt: new Date(),
        },
      }
    );
    console.log('✅ Added Telugu translation to Article');

    console.log('\n🔍 Verification and examples...');

    // Verify the documents
    const stotraDoc_final = await contentsCollection.findOne({
      canonicalSlug: 'shiva-tandava-stotra',
    });
    const articleDoc_final = await contentsCollection.findOne({
      canonicalSlug: 'meaning-of-suprabhata-traditions',
    });

    console.log('\n📋 Final document examples:');

    if (stotraDoc_final) {
      console.log(`\n1. STOTRA Example:`);
      console.log(`   Canonical Slug: ${stotraDoc_final.canonicalSlug}`);
      console.log(`   Content Type: ${stotraDoc_final.contentType}`);
      console.log(`   Status: ${stotraDoc_final.status}`);
      console.log(`   Languages: ${Object.keys(stotraDoc_final.translations).join(', ')}`);
      console.log(
        `   Category IDs: ${stotraDoc_final.categories.typeIds.length + stotraDoc_final.categories.devaIds.length + stotraDoc_final.categories.byNumberIds.length} total`
      );

      // Show English and Telugu paths
      if (stotraDoc_final.translations.en) {
        console.log(`   EN Path: ${stotraDoc_final.translations.en.path}`);
      }
      if (stotraDoc_final.translations.te) {
        console.log(`   TE Path: ${stotraDoc_final.translations.te.path}`);
      }
    }

    if (articleDoc_final) {
      console.log(`\n2. ARTICLE Example:`);
      console.log(`   Canonical Slug: ${articleDoc_final.canonicalSlug}`);
      console.log(`   Content Type: ${articleDoc_final.contentType}`);
      console.log(`   Status: ${articleDoc_final.status}`);
      console.log(`   Languages: ${Object.keys(articleDoc_final.translations).join(', ')}`);
      console.log(`   Updated Title: ${articleDoc_final.translations.en.title}`);
      console.log(`   YouTube URL: ${articleDoc_final.translations.en.youtubeUrl || 'null'}`);
    }

    // Test unique constraints
    console.log('\n🧪 Testing unique constraints...');

    try {
      await contentsCollection.insertOne({
        contentType: 'stotra',
        canonicalSlug: 'shiva-tandava-stotra', // Duplicate canonical slug
        categories: { typeIds: [], devaIds: [], byNumberIds: [] },
        imageUrl: null,
        status: 'draft',
        translations: {
          en: {
            title: 'Test Duplicate',
            seoTitle: null,
            youtubeUrl: null,
            slug: 'test-duplicate',
            path: '/en/test-duplicate',
            stotra: null,
            stotraMeaning: null,
            body: null,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ Canonical slug uniqueness constraint NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ Canonical slug uniqueness constraint is working');
      }
    }

    try {
      await contentsCollection.insertOne({
        contentType: 'article',
        canonicalSlug: 'test-unique-slug',
        categories: { typeIds: [], devaIds: [], byNumberIds: [] },
        imageUrl: null,
        status: 'draft',
        translations: {
          en: {
            title: 'Test Duplicate Path',
            seoTitle: null,
            youtubeUrl: null,
            slug: 'test-duplicate-path',
            path: '/en/stotra/shiva/shiva-tandava-stotra', // Duplicate EN path
            stotra: null,
            stotraMeaning: null,
            body: null,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('❌ English path uniqueness constraint NOT working');
    } catch (error: any) {
      if (error.code === 11000) {
        console.log('✅ English path uniqueness constraint is working');
      }
    }

    const totalDocs = await contentsCollection.countDocuments();
    console.log(`\n📊 Total documents in contents collection: ${totalDocs}`);

    console.log('\n✅ Content examples inserted and tested successfully!');
    console.log(`\n🔍 MongoDB Admin UI: http://localhost:8082`);
    console.log(`   Database: ssbhakthi_api`);
    console.log(`   Collection: contents`);
    console.log(`   Sample Documents: 2 (1 Stotra, 1 Article)`);
    console.log(`   Multilingual Support: Demonstrated with EN, TE, HI translations`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected');
  }
}

insertContentExamples();
