import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
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

    const { lang = 'en', limit = '50', offset = '0', status } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    console.log('🔍 Query parameters:', { languageCode, limitNum, offsetNum, status });

    // Build query
    const query: any = {
      contentType: 'stotra',
    };

    // Only filter by status if explicitly provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add language filter - only include documents that have the requested language
    query[`translations.${languageCode}`] = { $exists: true };

    console.log('🔎 MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const [stotras, total] = await Promise.all([
      Content.find(query).sort({ updatedAt: -1 }).skip(offsetNum).limit(limitNum).lean(),
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

    // Return stotra with only the requested language translation (consistent with list endpoint)
    res.json({
      canonicalSlug: stotra.canonicalSlug,
      contentType: stotra.contentType,
      status: stotra.status,
      imageUrl: stotra.imageUrl,
      categories: stotra.categories,
      translations: {
        [languageCode]: stotra.translations[languageCode],
      },
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

// POST /rest/stotras - Create new stotra
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Creating new stotra with data:', req.body);

    const {
      contentType = 'stotra',
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

    // Check if stotra with this slug already exists
    const existingStotra = await Content.findOne({
      canonicalSlug,
      contentType: 'stotra',
    });

    if (existingStotra) {
      res.status(409).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' already exists`,
          code: 'CONFLICT',
        },
      });
      return;
    }

    // Create new stotra using direct MongoDB insertion
    const currentTime = new Date();

    console.log('🗨️ Debugging - translations data:', JSON.stringify(translations, null, 2));

    // Use direct MongoDB insertion to bypass Mongoose
    console.log('🗨️ Using direct MongoDB insertion to bypass Mongoose...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const contentsCollection = db.collection('contents');

    const stotraDoc = {
      contentType,
      canonicalSlug,
      status,
      imageUrl,
      categories: categories || { typeIds: [], devaIds: [], byNumberIds: [] },
      translations,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    console.log('🗨️ Final document to insert:', JSON.stringify(stotraDoc, null, 2));

    const result = await contentsCollection.insertOne(stotraDoc);

    console.log('✅ Stotra created successfully with ID:', result.insertedId);

    // Fetch the created document to return
    const savedStotra = await contentsCollection.findOne({ _id: result.insertedId });

    if (!savedStotra) {
      throw new Error('Failed to retrieve created stotra');
    }

    console.log('✅ Stotra created successfully:', savedStotra['canonicalSlug']);

    res.status(201).json({
      success: true,
      stotra: savedStotra,
      message: 'Stotra created successfully',
    });
  } catch (error) {
    console.error('Error creating stotra:', error);
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
          message: 'Failed to create stotra',
          code: 'INTERNAL_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
});

// PUT /rest/stotras/:canonicalSlug - Update existing stotra
router.put('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    console.log(`📝 Updating stotra '${canonicalSlug}' with data:`, req.body);

    const { status, imageUrl, categories, translations } = req.body;

    // Find existing stotra
    const existingStotra = await Content.findOne({
      canonicalSlug,
      contentType: 'stotra',
    });

    if (!existingStotra) {
      res.status(404).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' not found`,
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
        ...existingStotra.translations,
        ...translations,
      };
    }

    // Update the stotra
    const updatedStotra = await Content.findOneAndUpdate(
      { canonicalSlug, contentType: 'stotra' },
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Stotra updated successfully:', updatedStotra?.canonicalSlug);

    res.json({
      success: true,
      stotra: updatedStotra,
      message: 'Stotra updated successfully',
    });
  } catch (error) {
    console.error('Error updating stotra:', error);

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
          message: 'Failed to update stotra',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
});

// DELETE /rest/stotras/:canonicalSlug - Delete stotra
router.delete('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    console.log(`🗑️ Deleting stotra '${canonicalSlug}'`);

    // Find and delete stotra
    const deletedStotra = await Content.findOneAndDelete({
      canonicalSlug,
      contentType: 'stotra',
    });

    if (!deletedStotra) {
      res.status(404).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    console.log('✅ Stotra deleted successfully:', deletedStotra.canonicalSlug);

    res.json({
      success: true,
      message: 'Stotra deleted successfully',
      deletedSlug: canonicalSlug,
    });
  } catch (error) {
    console.error('Error deleting stotra:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete stotra',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

export default router;
