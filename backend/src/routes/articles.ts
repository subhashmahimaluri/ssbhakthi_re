import { Request, Response, Router } from 'express';
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

    const { lang = 'en', limit = '50', offset = '0', status = 'published' } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    console.log('🔍 Query parameters:', { languageCode, limitNum, offsetNum, status });

    // Build query
    const query: any = {
      contentType: 'article',
    };

    if (status) {
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

export default router;
