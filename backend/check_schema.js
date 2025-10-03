require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkSchema() {
  const client = new MongoClient(process.env.MONGODB_URL);
  await client.connect();
  const db = client.db();
  const collections = await db.listCollections({ name: 'contents' }).toArray();
  
  if (collections[0] && collections[0].options && collections[0].options.validator) {
    console.log('Current validation schema:');
    console.log(JSON.stringify(collections[0].options.validator, null, 2));
  } else {
    console.log('No validation schema found');
  }
  
  await client.close();
}

checkSchema().catch(console.error);
