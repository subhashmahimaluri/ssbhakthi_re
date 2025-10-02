import mongoose from 'mongoose';
import { Content } from '../src/models/Content';

// Database connection
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssbhakthi';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Migration function to add articleTitle field to existing articles
async function addArticleTitleToExistingArticles() {
  try {
    console.log('Starting migration: Adding articleTitle field to existing articles...');

    // Find all articles that don't have articleTitle field
    const articles = await Content.find({
      contentType: 'article',
      articleTitle: { $exists: false },
    });

    console.log(`Found ${articles.length} articles without articleTitle field`);

    if (articles.length === 0) {
      console.log('No articles need migration. All articles already have articleTitle field.');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const article of articles) {
      try {
        // Generate articleTitle from the first available translation title
        const translations = article.translations;
        const languages = ['en', 'te', 'hi', 'kn'];
        let articleTitle = '';

        // Try to find a suitable title from available translations
        for (const lang of languages) {
          if (translations[lang] && translations[lang].title) {
            articleTitle = translations[lang].title;
            break;
          }
        }

        // If no title found, use canonical slug as fallback
        if (!articleTitle) {
          articleTitle = article.canonicalSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }

        // Update the article with the new articleTitle
        await Content.updateOne(
          { _id: article._id },
          {
            $set: {
              articleTitle: articleTitle,
            },
          }
        );

        console.log(`✅ Updated article: ${article.canonicalSlug} -> "${articleTitle}"`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update article ${article.canonicalSlug}:`, error);
        errors++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`✅ Successfully updated: ${updated} articles`);
    console.log(`❌ Errors: ${errors} articles`);

    if (errors > 0) {
      console.log('\nSome articles failed to update. Please check the logs above.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectToDatabase();
    await addArticleTitleToExistingArticles();
    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

export { addArticleTitleToExistingArticles };
