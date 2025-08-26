import { Request, Response, Router } from 'express';
import { Content, LanguageCode } from '../models/Content';

const router: Router = Router();

// Helper function to get language code
function getLanguageCode(lang: string): LanguageCode {
  const validLangs: LanguageCode[] = ['en', 'te', 'hi', 'kn'];
  return validLangs.includes(lang as LanguageCode) ? (lang as LanguageCode) : 'en';
}

// GET /rest/stotras - List all stotras
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Stotras API called with query:', req.query);

    const { lang = 'en', limit = '50', offset = '0', status = 'published' } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    console.log('🔍 Query parameters:', { languageCode, limitNum, offsetNum, status });

    // Build query
    const query: any = {
      contentType: 'stotra',
    };

    if (status) {
      query.status = status;
    }

    // Add language filter - only include documents that have the requested language
    query[`translations.${languageCode}`] = { $exists: true };

    console.log('🔎 MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query
    const [stotras, total] = await Promise.all([
      Content.find(query)
        .sort({ createdAt: -1 })
        .skip(offsetNum)
        .limit(limitNum)
        .select('canonicalSlug contentType status translations imageUrl createdAt updatedAt')
        .lean(),
      Content.countDocuments(query),
    ]);

    console.log('📊 Query results:', { foundStotras: stotras.length, total });
    console.log(
      '📄 Sample stotra:',
      stotras[0] ? JSON.stringify(stotras[0], null, 2) : 'No stotras found'
    );

    // Transform response to include only requested language translation
    const transformedStotras = stotras.map(stotra => ({
      canonicalSlug: stotra.canonicalSlug,
      contentType: stotra.contentType,
      status: stotra.status,
      imageUrl: stotra.imageUrl,
      translations: {
        [languageCode]: stotra.translations[languageCode],
      },
      createdAt: stotra.createdAt,
      updatedAt: stotra.updatedAt,
    }));

    res.json({
      stotras: transformedStotras,
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
        contentType: 'stotra',
      },
    });
  } catch (error) {
    console.error('Error fetching stotras:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch stotras',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// GET /rest/stotras/:canonicalSlug - Get single stotra by canonical slug
router.get('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    const { lang = 'en' } = req.query;

    const languageCode = getLanguageCode(lang as string);

    // Find stotra by canonical slug
    const stotra = await Content.findOne({
      canonicalSlug,
      contentType: 'stotra',
    }).lean();

    if (!stotra) {
      res.status(404).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    // Check if requested language exists
    if (!stotra.translations[languageCode]) {
      res.status(404).json({
        error: {
          message: `Stotra '${canonicalSlug}' not available in language '${languageCode}'`,
          code: 'TRANSLATION_NOT_FOUND',
          availableLanguages: Object.keys(stotra.translations),
        },
      });
      return;
    }

    // Return stotra with all translations but highlight requested language
    res.json({
      canonicalSlug: stotra.canonicalSlug,
      contentType: stotra.contentType,
      status: stotra.status,
      imageUrl: stotra.imageUrl,
      categories: stotra.categories,
      translations: stotra.translations,
      meta: {
        requestedLanguage: languageCode,
        availableLanguages: Object.keys(stotra.translations),
        translation: stotra.translations[languageCode],
      },
      createdAt: stotra.createdAt,
      updatedAt: stotra.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching stotra:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch stotra',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// GET /rest/stotras/slug/:slug - Find stotra by language-specific slug
router.get('/slug/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { lang = 'en' } = req.query;

    const languageCode = getLanguageCode(lang as string);

    // Find stotra by language-specific slug
    const stotra = await Content.findOne({
      [`translations.${languageCode}.slug`]: slug,
      contentType: 'stotra',
    }).lean();

    if (!stotra) {
      res.status(404).json({
        error: {
          message: `Stotra with ${languageCode} slug '${slug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    // Redirect to canonical URL
    res.redirect(301, `/rest/stotras/${stotra.canonicalSlug}?lang=${languageCode}`);
  } catch (error) {
    console.error('Error finding stotra by slug:', error);
    res.status(500).json({
      error: {
        message: 'Failed to find stotra',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

export default router;
