import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { requireAuth } from '../auth/jwt';
import { Comment, Content, LanguageCode } from '../models';

const router: Router = Router();

// Comprehensive text sanitization function for security
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove HTML tags completely
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Escape HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove potential SQL injection patterns
  sanitized = sanitized
    .replace(/('|(\-\-)|;|\||\*|%)/g, '')
    .replace(
      /\b(exec(ute)?|insert|select|delete|update|drop|create|alter|union|script|eval|expression)\b/gi,
      '[removed]'
    );

  // Handle URLs more comprehensively
  sanitized = sanitized
    .replace(/(https?:\/\/[^\s]+)/gi, '[URL removed]')
    .replace(/(www\.[^\s]+)/gi, '[URL removed]')
    .replace(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, '[URL removed]');

  // Remove dangerous script patterns
  sanitized = sanitized
    .replace(/(javascript:|data:|vbscript:|about:|file:|ftp:)/gi, '[Script removed]')
    .replace(/on\w+\s*=/gi, '[Event removed]');

  // Remove potential code injection patterns
  sanitized = sanitized
    .replace(/\$\{[^}]*\}/g, '[Template removed]')
    .replace(/<%[^%]*%>/g, '[Template removed]')
    .replace(/{{[^}]*}}/g, '[Template removed]');

  // Clean excessive whitespace and normalize
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  // Limit length to prevent abuse
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '...';
  }

  return sanitized;
}

// Rate limiting for POST requests (comment creation)
const commentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env['NODE_ENV'] === 'development' ? 50 : 5, // Higher limit for development
  message: {
    error: 'Too many comments submitted',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to validate language code
function getLanguageCode(lang: string): LanguageCode {
  const validLangs: LanguageCode[] = ['en', 'te', 'hi', 'kn'];
  return validLangs.includes(lang as LanguageCode) ? (lang as LanguageCode) : 'en';
}

// GET /rest/comments/:canonicalSlug - Get comments for a content
router.get('/:canonicalSlug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { canonicalSlug } = req.params;
    const { lang = 'en', limit = '20', offset = '0' } = req.query;

    const languageCode = getLanguageCode(lang as string);
    const limitNum = Math.min(parseInt(limit as string) || 20, 100); // Max 100
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

    console.log('📋 Comments API called with params:', {
      canonicalSlug,
      languageCode,
      limitNum,
      offsetNum,
    });

    // Find the content first to get the contentId
    const content = await Content.findOne({
      canonicalSlug,
      status: 'published',
    }).lean();

    // Development bypass for content validation
    if (
      !content &&
      process.env['NODE_ENV'] === 'development' &&
      process.env['BYPASS_AUTH'] === 'true'
    ) {
      console.log('⚠️  Content validation bypassed for GET comments');
      // Build query for comments without content validation
      const query = {
        canonicalSlug,
        lang: languageCode,
        status: 'approved',
      };

      // Execute query with pagination (without .lean() to get proper transformation)
      const [comments, total] = await Promise.all([
        Comment.find(query).sort({ createdAt: -1 }).skip(offsetNum).limit(limitNum),
        Comment.countDocuments(query),
      ]);

      console.log('📊 Comments query results (bypassed):', {
        foundComments: comments.length,
        total,
      });

      res.json({
        items: comments, // Will automatically use toJSON transformation
        total,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          hasNext: offsetNum + limitNum < total,
          hasPrev: offsetNum > 0,
        },
        meta: {
          canonicalSlug,
          language: languageCode,
          contentId: 'bypassed-for-dev',
        },
      });
      return;
    }

    if (!content) {
      res.status(404).json({
        error: {
          message: `Content with slug '${canonicalSlug}' not found`,
          code: 'CONTENT_NOT_FOUND',
        },
      });
      return;
    }

    // Check if the content has the requested language
    if (!content.translations[languageCode]) {
      res.status(404).json({
        error: {
          message: `Content '${canonicalSlug}' not available in language '${languageCode}'`,
          code: 'TRANSLATION_NOT_FOUND',
          availableLanguages: Object.keys(content.translations),
        },
      });
      return;
    }

    // Build query for comments
    const query = {
      canonicalSlug,
      lang: languageCode,
      status: 'approved',
    };

    // Execute query with pagination (without .lean() to get proper transformation)
    const [comments, total] = await Promise.all([
      Comment.find(query).sort({ createdAt: -1 }).skip(offsetNum).limit(limitNum),
      Comment.countDocuments(query),
    ]);

    console.log('📊 Comments query results:', { foundComments: comments.length, total });

    res.json({
      items: comments, // Will automatically use toJSON transformation
      total,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasNext: offsetNum + limitNum < total,
        hasPrev: offsetNum > 0,
      },
      meta: {
        canonicalSlug,
        language: languageCode,
        contentId: content._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch comments',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

// POST /rest/comments - Create a new comment
router.post(
  '/',
  commentRateLimit,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { canonicalSlug, lang, text } = req.body;
      const user = req.user!; // requireAuth ensures user exists

      // Validate required fields
      if (!canonicalSlug || !lang || !text) {
        res.status(400).json({
          error: {
            message: 'Missing required fields: canonicalSlug, lang, text',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      // Validate language
      const languageCode = getLanguageCode(lang);
      if (languageCode !== lang) {
        res.status(400).json({
          error: {
            message: `Invalid language code '${lang}'. Supported: en, te, hi, kn`,
            code: 'INVALID_LANGUAGE',
          },
        });
        return;
      }

      // Validate text length
      const trimmedText = text.trim();
      if (trimmedText.length === 0 || trimmedText.length > 2000) {
        res.status(400).json({
          error: {
            message: 'Comment text must be between 1 and 2000 characters',
            code: 'INVALID_TEXT_LENGTH',
          },
        });
        return;
      }

      // Sanitize text to prevent XSS and injection attacks
      const sanitizedText = sanitizeText(trimmedText);
      if (sanitizedText.length === 0) {
        res.status(400).json({
          error: {
            message: 'Comment contains invalid content',
            code: 'INVALID_CONTENT',
          },
        });
        return;
      }

      console.log('💬 Creating comment:', {
        canonicalSlug,
        lang: languageCode,
        userId: user.sub,
        textLength: sanitizedText.length,
      });

      // Find the content and verify it exists
      const content = await Content.findOne({
        canonicalSlug,
        status: 'published',
      }).lean();

      // Development bypass for content validation
      if (
        !content &&
        process.env['NODE_ENV'] === 'development' &&
        process.env['BYPASS_AUTH'] === 'true'
      ) {
        console.log('⚠️  Content validation bypassed for development');
        // Create a mock comment without content validation
        const newComment = new Comment({
          contentId: null, // No content ID for bypassed comments
          canonicalSlug,
          lang: languageCode,
          userId: user.sub,
          userName: user.preferred_username || user.email?.split('@')[0] || 'Anonymous User',
          userEmail: user.email,
          text: sanitizedText,
          status: 'approved',
        });

        const savedComment = await newComment.save();
        console.log('✅ Comment created successfully (bypassed):', savedComment.id);

        res.status(201).json({
          comment: savedComment,
          meta: {
            canonicalSlug,
            language: languageCode,
            contentId: 'bypassed-for-dev',
          },
        });
        return;
      }

      if (!content) {
        res.status(404).json({
          error: {
            message: `Content with slug '${canonicalSlug}' not found`,
            code: 'CONTENT_NOT_FOUND',
          },
        });
        return;
      }

      // Check if the content has the requested language
      if (!content.translations[languageCode]) {
        res.status(404).json({
          error: {
            message: `Content '${canonicalSlug}' not available in language '${languageCode}'`,
            code: 'TRANSLATION_NOT_FOUND',
            availableLanguages: Object.keys(content.translations),
          },
        });
        return;
      }

      // Extract user information for the comment
      const userName = user.preferred_username || user.email?.split('@')[0] || 'Anonymous User';

      // Create new comment
      const newComment = new Comment({
        contentId: content._id,
        canonicalSlug,
        lang: languageCode,
        userId: user.sub,
        userName,
        userEmail: user.email,
        text: sanitizedText,
        status: 'approved', // Default to approved as per requirements
      });

      const savedComment = await newComment.save();

      console.log('✅ Comment created successfully:', savedComment.id);

      // Return the saved comment
      res.status(201).json({
        comment: savedComment,
        meta: {
          canonicalSlug,
          language: languageCode,
          contentId: content._id.toString(),
        },
      });
    } catch (error) {
      console.error('Error creating comment:', error);

      // Handle duplicate key errors or validation errors
      if (error instanceof Error && 'code' in error) {
        if ((error as any).code === 11000) {
          res.status(409).json({
            error: {
              message: 'Duplicate comment detected',
              code: 'DUPLICATE_COMMENT',
            },
          });
          return;
        }
      }

      res.status(500).json({
        error: {
          message: 'Failed to create comment',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
);

// PUT /rest/comments/:commentId - Update a comment
router.put(
  '/:commentId',
  commentRateLimit,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;
      const user = req.user!; // requireAuth ensures user exists

      // Validate comment ID
      if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        res.status(400).json({
          error: {
            message: 'Invalid comment ID',
            code: 'INVALID_COMMENT_ID',
          },
        });
        return;
      }

      // Validate text
      if (!text || typeof text !== 'string') {
        res.status(400).json({
          error: {
            message: 'Missing or invalid text field',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      const trimmedText = text.trim();
      if (trimmedText.length === 0 || trimmedText.length > 2000) {
        res.status(400).json({
          error: {
            message: 'Comment text must be between 1 and 2000 characters',
            code: 'INVALID_TEXT_LENGTH',
          },
        });
        return;
      }

      // Sanitize text to prevent XSS and injection attacks
      const sanitizedText = sanitizeText(trimmedText);
      if (sanitizedText.length === 0) {
        res.status(400).json({
          error: {
            message: 'Comment contains invalid content',
            code: 'INVALID_CONTENT',
          },
        });
        return;
      }

      // Find the comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        res.status(404).json({
          error: {
            message: 'Comment not found',
            code: 'COMMENT_NOT_FOUND',
          },
        });
        return;
      }

      // Check if user owns the comment (by userId or email)
      const isOwnerByUserId = comment.userId === user.sub;
      const isOwnerByEmail = user.email && comment.userEmail && comment.userEmail === user.email;
      const isOwner = isOwnerByUserId || isOwnerByEmail;

      console.log('🔍 Comment ownership check for EDIT:', {
        commentId,
        commentUserId: comment.userId,
        commentUserEmail: comment.userEmail,
        currentUserId: user.sub,
        currentUserEmail: user.email,
        isOwnerByUserId,
        isOwnerByEmail,
        isOwner,
      });

      if (!isOwner) {
        res.status(403).json({
          error: {
            message: 'You can only edit your own comments',
            code: 'UNAUTHORIZED_EDIT',
          },
        });
        return;
      }

      // Update the comment
      comment.text = sanitizedText;
      comment.updatedAt = new Date();
      const updatedComment = await comment.save();

      console.log('✅ Comment updated successfully:', updatedComment.id);

      res.json({
        comment: updatedComment,
        meta: {
          action: 'updated',
          commentId: updatedComment.id,
        },
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({
        error: {
          message: 'Failed to update comment',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  }
);

// DELETE /rest/comments/:commentId - Delete a comment
router.delete('/:commentId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const user = req.user!; // requireAuth ensures user exists

    // Validate comment ID
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({
        error: {
          message: 'Invalid comment ID',
          code: 'INVALID_COMMENT_ID',
        },
      });
      return;
    }

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({
        error: {
          message: 'Comment not found',
          code: 'COMMENT_NOT_FOUND',
        },
      });
      return;
    }

    // Check if user owns the comment (by userId or email)
    const isOwnerByUserId = comment.userId === user.sub;
    const isOwnerByEmail = user.email && comment.userEmail && comment.userEmail === user.email;
    const isOwner = isOwnerByUserId || isOwnerByEmail;

    console.log('🔍 Comment ownership check for DELETE:', {
      commentId,
      commentUserId: comment.userId,
      commentUserEmail: comment.userEmail,
      currentUserId: user.sub,
      currentUserEmail: user.email,
      isOwnerByUserId,
      isOwnerByEmail,
      isOwner,
    });

    if (!isOwner) {
      res.status(403).json({
        error: {
          message: 'You can only delete your own comments',
          code: 'UNAUTHORIZED_DELETE',
        },
      });
      return;
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    console.log('✅ Comment deleted successfully:', commentId);

    res.json({
      success: true,
      meta: {
        action: 'deleted',
        commentId: commentId,
      },
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      error: {
        message: 'Failed to delete comment',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

export default router;
