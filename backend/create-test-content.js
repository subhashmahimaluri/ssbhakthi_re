const { MongoClient } = require('mongodb');

async function createTestContent() {
  const client = new MongoClient(
    'mongodb://admin:devpassword123@localhost:27017/?authSource=admin'
  );

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('ssbhakthi_api');
    const collection = db.collection('contents');

    // Check if test content already exists
    const existing = await collection.findOne({ canonicalSlug: 'test-article' });
    if (existing) {
      console.log('Test content already exists');
      return;
    }

    // Create test article
    const testArticle = {
      type: 'article',
      canonicalSlug: 'test-article',
      status: 'published',
      translations: {
        en: {
          title: 'Test Article for Comments',
          slug: 'test-article',
          content: '<p>This is a test article for testing the comments functionality.</p>',
          seo: {
            title: 'Test Article for Comments',
            description: 'A test article to verify comments functionality',
          },
        },
        te: {
          title: 'కామెంట్స్ కోసం టెస్ట్ వ్యాసం',
          slug: 'test-article',
          content: '<p>ఇది కామెంట్స్ కార్యాచరణను పరీక్షించడానికి ఒక పరీక్ష వ్యాసం.</p>',
          seo: {
            title: 'కామెంట్స్ కోసం టెస్ట్ వ్యాసం',
            description: 'కామెంట్స్ కార్యాచరణను ధృవీకరించడానికి ఒక పరీక్ష వ్యాసం',
          },
        },
      },
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(testArticle);
    console.log('Test article created successfully');

    // Create test stotra
    const testStotra = {
      type: 'stotra',
      canonicalSlug: 'test-stotra',
      status: 'published',
      translations: {
        en: {
          title: 'Test Stotra for Comments',
          slug: 'test-stotra',
          content: '<p>This is a test stotra for testing the comments functionality.</p>',
          seo: {
            title: 'Test Stotra for Comments',
            description: 'A test stotra to verify comments functionality',
          },
        },
        te: {
          title: 'కామెంట్స్ కోసం టెస్ట్ స్తోత్రం',
          slug: 'test-stotra',
          content: '<p>ఇది కామెంట్స్ కార్యాచరణను పరీక్షించడానికి ఒక పరీక్ష స్తోత్రం.</p>',
          seo: {
            title: 'కామెంట్స్ కోసం టెస్ట్ స్తోత్రం',
            description: 'కామెంట్స్ కార్యాచరణను ధృవీకరించడానికి ఒక పరీక్ష స్తోత్రం',
          },
        },
      },
      createdBy: 'system',
      updatedBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(testStotra);
    console.log('Test stotra created successfully');
  } catch (error) {
    console.error('Error creating test content:', error);
  } finally {
    await client.close();
  }
}

createTestContent();
