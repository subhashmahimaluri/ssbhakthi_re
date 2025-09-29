import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { Content, LanguageCode } from '../models/Content';

const router: Router = Router();

// Helper function to get language code
function getLanguageCode(lang: string): LanguageCode {
  const validLangs: LanguageCode[] = ['en', 'te', 'hi', 'kn'];
  return validLangs.includes(lang as LanguageCode) ? (lang as LanguageCode) : 'en';
}

// GET /rest/articles - List all articles
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Articles API called with query:', req.query);

    const { lang = 'en', limit = '50', offset = '0', status } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    console.log('🔍 Query parameters:', { languageCode, limitNum, offsetNum, status });

    // Build query
    const query: any = {
      contentType: 'article',
    };

    // Only filter by status if explicitly provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add language filter - only include documents that have the requested language
    query[`translations.${languageCode}`] = { $exists: true };

    console.log('🔎 MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const [articles, total] = await Promise.all([
      Content.find(query).sort({ updatedAt: -1 }).skip(offsetNum).limit(limitNum).lean(),
      Content.countDocuments(query),
    ]);

    console.log('📊 Query results:', { foundArticles: articles.length, total });
    console.log(
      '📄 Sample article:',
      articles[0] ? JSON.stringify(articles[0], null, 2) : 'No articles found'
    );

    // Transform response to include only requested language translation
    const transformedArticles = articles.map(article => ({
      canonicalSlug: article.canonicalSlug,
      contentType: article.contentType,
      status: article.status,
      imageUrl: article.imageUrl,
      translations: {
        [languageCode]: article.translations[languageCode],
      },
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    res.json({
      articles: transformedArticles,
      pagination: {
        total,
        page: Math.floor(offsetNum / limitNum) + 1,
        limit: limitNum,
        offset: offsetNum,
        hasNext: offsetNum + limitNum < total,
        hasPrev: offsetNum > 0,
      },
      meta: {
        language: languageCode,
        contentType: 'article',
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch articles',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// GET /rest/articles/:canonicalSlug - Get single article by canonical slug
router.get('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    const { lang = 'en' } = req.query;

    const languageCode = getLanguageCode(lang as string);

    // Find article by canonical slug
    const article = await Content.findOne({
      canonicalSlug,
      contentType: 'article',
    }).lean();

    if (!article) {
      res.status(404).json({
        error: {
          message: `Article with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    // Check if requested language exists
    if (!article.translations[languageCode]) {
      res.status(404).json({
        error: {
          message: `Article '${canonicalSlug}' not available in language '${languageCode}'`,
          code: 'TRANSLATION_NOT_FOUND',
          availableLanguages: Object.keys(article.translations),
        },
      });
      return;
    }

    // Return article with only the requested language translation (consistent with list endpoint)
    res.json({
      canonicalSlug: article.canonicalSlug,
      contentType: article.contentType,
      status: article.status,
      imageUrl: article.imageUrl,
      categories: article.categories,
      translations: {
        [languageCode]: article.translations[languageCode],
      },
      meta: {
        requestedLanguage: languageCode,
        availableLanguages: Object.keys(article.translations),
        translation: article.translations[languageCode],
      },
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch article',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// POST /rest/articles - Create new article
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Creating new article with data:', req.body);

    const {
      contentType = 'article',
      canonicalSlug,
      status = 'draft',
      imageUrl,
      categories,
      translations,
    } = req.body;

    // Validate required fields
    if (!canonicalSlug || !translations || Object.keys(translations).length === 0) {
      res.status(400).json({
        error: {
          message: 'canonicalSlug and at least one translation are required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    // Check if article with this slug already exists
    const existingArticle = await Content.findOne({
      canonicalSlug,
      contentType: 'article',
    });

    if (existingArticle) {
      res.status(409).json({
        error: {
          message: `Article with slug '${canonicalSlug}' already exists`,
          code: 'CONFLICT',
        },
      });
      return;
    }

    // Create new article using direct MongoDB insertion
    const currentTime = new Date();

    console.log('🗨️ Debugging - translations data:', JSON.stringify(translations, null, 2));

    // Use direct MongoDB insertion to bypass Mongoose
    console.log('🗨️ Using direct MongoDB insertion to bypass Mongoose...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const contentsCollection = db.collection('contents');

    const articleDoc = {
      contentType,
      canonicalSlug,
      status,
      imageUrl,
      categories: categories || { typeIds: [], devaIds: [], byNumberIds: [] },
      translations,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    console.log('🗨️ Final document to insert:', JSON.stringify(articleDoc, null, 2));

    const result = await contentsCollection.insertOne(articleDoc);

    console.log('✅ Article created successfully with ID:', result.insertedId);

    // Fetch the created document to return
    const savedArticle = await contentsCollection.findOne({ _id: result.insertedId });

    if (!savedArticle) {
      throw new Error('Failed to retrieve created article');
    }

    console.log('✅ Article created successfully:', savedArticle['canonicalSlug']);

    res.status(201).json({
      success: true,
      article: savedArticle,
      message: 'Article created successfully',
    });
  } catch (error) {
    console.error('Error creating article:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Additional debugging for MongoDB validation errors
    if (error instanceof Error && 'errInfo' in error) {
      console.error('MongoDB error info:', (error as any).errInfo);
    }
    if (error instanceof Error && 'code' in error) {
      console.error('MongoDB error code:', (error as any).code);
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      console.error('Validation details:', error.message);
      res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
      });
    } else {
      res.status(500).json({
        error: {
          message: 'Failed to create article',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
});

// PUT /rest/articles/:canonicalSlug - Update existing article
router.put('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    console.log(`📝 Updating article '${canonicalSlug}' with data:`, req.body);

    const { status, imageUrl, categories, translations } = req.body;

    // Find existing article
    const existingArticle = await Content.findOne({
      canonicalSlug,
      contentType: 'article',
    });

    if (!existingArticle) {
      res.status(404).json({
        error: {
          message: `Article with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    // Update fields
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categories !== undefined) updateData.categories = categories;

    // Merge translations - preserve existing ones and add/update new ones
    if (translations) {
      updateData.translations = {
        ...existingArticle.translations,
        ...translations,
      };
    }

    // Update the article
    const updatedArticle = await Content.findOneAndUpdate(
      { canonicalSlug, contentType: 'article' },
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Article updated successfully:', updatedArticle?.canonicalSlug);

    res.json({
      success: true,
      article: updatedArticle,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Error updating article:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.message,
        },
      });
    } else {
      res.status(500).json({
        error: {
          message: 'Failed to update article',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
});

// DELETE /rest/articles/:canonicalSlug - Delete article
router.delete('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    console.log(`🗑️ Deleting article '${canonicalSlug}'`);

    // Find and delete article
    const deletedArticle = await Content.findOneAndDelete({
      canonicalSlug,
      contentType: 'article',
    });

    if (!deletedArticle) {
      res.status(404).json({
        error: {
          message: `Article with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    console.log('✅ Article deleted successfully:', deletedArticle.canonicalSlug);

    res.json({
      success: true,
      message: 'Article deleted successfully',
      deletedSlug: canonicalSlug,
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete article',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

export default router;
