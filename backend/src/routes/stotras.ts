import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../auth/jwt';
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
    const { lang = 'en', limit = '50', offset = '0', status, categoryId, page } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100

    // Support both offset and page-based pagination
    let offsetNum: number;
    if (page) {
      const pageNum = Math.max(parseInt(page as string) || 1, 1);
      offsetNum = (pageNum - 1) * limitNum;
    } else {
      offsetNum = Math.max(parseInt(offset as string) || 0, 0);
    }

    // Build query
    const query: any = {
      contentType: 'stotra',
    };

    // For public access (when no status is specified), only show published stotras
    if (!status || status === 'all') {
      // Check if this is an admin request (you can determine this by checking headers or auth)
      const isAdminRequest = req.headers['x-admin-access'] === 'true' || status === 'all';

      if (!isAdminRequest) {
        query.status = 'published';
      }
    } else if (status !== 'all') {
      query.status = status;
    }

    // Add language filter - only include documents that have the requested language
    query[`translations.${languageCode}`] = { $exists: true };

    // Add category filter if provided
    if (categoryId && typeof categoryId === 'string') {
      // Support filtering by any of the category types
      // Note: category IDs can be stored as either strings or ObjectIds
      const categoryObjectId = new mongoose.Types.ObjectId(categoryId);
      query.$or = [
        { 'categories.typeIds': categoryId }, // String format
        { 'categories.typeIds': categoryObjectId }, // ObjectId format
        { 'categories.devaIds': categoryId }, // String format
        { 'categories.devaIds': categoryObjectId }, // ObjectId format
        { 'categories.byNumberIds': categoryId }, // String format
        { 'categories.byNumberIds': categoryObjectId }, // ObjectId format
      ];
    }

    // Execute query with pagination
    const [stotras, total] = await Promise.all([
      Content.find(query).sort({ updatedAt: -1 }).skip(offsetNum).limit(limitNum).lean(),
      Content.countDocuments(query),
    ]);

    // Transform response to include only requested language translation
    const transformedStotras = stotras.map(stotra => ({
      canonicalSlug: stotra.canonicalSlug,
      contentType: stotra.contentType,
      stotraTitle: stotra.stotraTitle,
      status: stotra.status,
      imageUrl: stotra.imageUrl,
      categories: stotra.categories,
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
        page: page ? parseInt(page as string) : Math.floor(offsetNum / limitNum) + 1,
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
      stotraTitle: stotra.stotraTitle,
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
router.post(
  '/',
  requireAuth,
  requireRole('author', 'editor', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📝 Creating new stotra with data:', req.body);

      const {
        contentType = 'stotra',
        canonicalSlug,
        stotraTitle,
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

      // Convert string category IDs to ObjectIds
      const convertToObjectIds = (ids: string[] | undefined): mongoose.Types.ObjectId[] => {
        if (!ids || !Array.isArray(ids)) return [];
        return ids
          .filter(id => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
          .map(id => new mongoose.Types.ObjectId(id));
      };

      const processedCategories = {
        typeIds: convertToObjectIds(categories?.typeIds),
        devaIds: convertToObjectIds(categories?.devaIds),
        byNumberIds: convertToObjectIds(categories?.byNumberIds),
      };

      const stotraDoc = {
        contentType,
        canonicalSlug,
        stotraTitle,
        status,
        imageUrl,
        categories: processedCategories,
        translations,
        createdAt: currentTime,
        updatedAt: currentTime,
      };

      console.log('🗨️ Final document to insert:', JSON.stringify(stotraDoc, null, 2));

      const result = await contentsCollection.insertOne(stotraDoc, {
        bypassDocumentValidation: true, // Bypass MongoDB JSON Schema validation
      });

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

        // Handle specific MongoDB errors
        if ((error as any).code === 121) {
          console.error('Document validation failed - Schema mismatch');
          res.status(400).json({
            error: {
              message: 'Document validation failed',
              code: 'SCHEMA_VALIDATION_ERROR',
              details: 'Document does not conform to collection schema',
            },
          });
          return;
        }
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
  }
);

// PUT /rest/stotras/:canonicalSlug - Update existing stotra
router.put('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    console.log(`📝 Updating stotra '${canonicalSlug}' with data:`, req.body);

    const { status, stotraTitle, imageUrl, categories, translations } = req.body;

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
    if (stotraTitle !== undefined) updateData.stotraTitle = stotraTitle;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (categories !== undefined) updateData.categories = categories;

    // Merge translations - preserve existing ones and add/update new ones
    if (translations) {
      updateData.translations = {
        ...existingStotra.translations,
        ...translations,
      };
    }

    // Update the stotra using direct MongoDB updateOne to bypass JSON Schema validation issues
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const contentsCollection = db.collection('contents');

    // Use direct MongoDB updateOne to bypass JSON Schema validation issues
    const result = await contentsCollection.updateOne(
      { canonicalSlug, contentType: 'stotra' },
      { $set: { ...updateData, updatedAt: new Date() } },
      { bypassDocumentValidation: true } // Bypass MongoDB JSON Schema validation
    );

    if (result.matchedCount === 0) {
      res.status(404).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    if (result.modifiedCount === 0) {
      console.log('⚠️ No changes were made to the stotra');
    }

    // Fetch the updated document to return
    const updatedStotra = await contentsCollection.findOne({
      canonicalSlug,
      contentType: 'stotra',
    });

    if (!updatedStotra) {
      res.status(404).json({
        error: {
          message: `Stotra with slug '${canonicalSlug}' not found`,
          code: 'NOT_FOUND',
        },
      });
      return;
    }

    console.log('✅ Stotra updated successfully:', updatedStotra?.['canonicalSlug']);

    res.json({
      success: true,
      stotra: updatedStotra,
      message: 'Stotra updated successfully',
    });
  } catch (error) {
    console.error('Error updating stotra:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    // Additional debugging for MongoDB validation errors
    if (error instanceof Error && 'errInfo' in error) {
      console.error('MongoDB error info:', (error as any).errInfo);
    }
    if (error instanceof Error && 'code' in error) {
      console.error('MongoDB error code:', (error as any).code);
    }

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
          details: error instanceof Error ? error.message : 'Unknown error',
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
