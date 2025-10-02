import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { Article, Category, Comment, Content, MediaAsset, Tag, User } from '../../models';
import { QueryResolvers } from '../__generated__/types';
import { GraphQLContext } from '../context';

export const Query: QueryResolvers<GraphQLContext> = {
  ping: () => 'pong',

  me: async (_, __, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Find or create user record
    let dbUser = await User.findOne({ keycloakId: user.sub });

    if (!dbUser) {
      dbUser = new User({
        keycloakId: user.sub,
        email: user.email || '',
        username: user.preferred_username,
        roles: user.roles,
      });
      await dbUser.save();
    } else {
      // Update user info if changed
      let hasChanges = false;
      if (user.email && dbUser.email !== user.email) {
        dbUser.email = user.email;
        hasChanges = true;
      }
      if (user.preferred_username && dbUser.username !== user.preferred_username) {
        dbUser.username = user.preferred_username;
        hasChanges = true;
      }
      if (JSON.stringify(dbUser.roles) !== JSON.stringify(user.roles)) {
        dbUser.roles = user.roles;
        hasChanges = true;
      }
      if (hasChanges) {
        dbUser.lastLogin = new Date();
        await dbUser.save();
      }
    }

    return dbUser;
  },

  article: async (_, { id }) => {
    const article = await Article.findById(id);
    if (!article) {
      throw new GraphQLError(`Article with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return article;
  },

  articles: async (_, { filters = {}, limit = 20, offset = 0, sort = [] }) => {
    const query: any = { isActive: true };

    // Apply filters
    if (filters?.locale) {
      query.locales = filters.locale;
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.category) {
      query.categories = filters.category;
    }
    if (filters?.tag) {
      query.tags = filters.tag;
    }
    if (filters?.createdBy) {
      query['audit.createdBy'] = filters.createdBy;
    }
    if (filters?.search) {
      query.$text = { $search: filters.search };
    }

    // Build sort object
    const sortObj: any = {};
    if (sort && sort.length > 0) {
      sort.forEach(s => {
        const direction = s.direction === 'ASC' ? 1 : -1;
        switch (s.field) {
          case 'CREATED_AT':
            sortObj['audit.createdAt'] = direction;
            break;
          case 'UPDATED_AT':
            sortObj['audit.updatedAt'] = direction;
            break;
          case 'TITLE':
            sortObj['title.en'] = direction;
            break;
          case 'STATUS':
            sortObj.status = direction;
            break;
          default:
            sortObj['audit.updatedAt'] = -1;
        }
      });
    } else {
      sortObj['audit.updatedAt'] = -1;
    }

    const [items, total] = await Promise.all([
      Article.find(query).sort(sortObj).skip(offset).limit(limit),
      Article.countDocuments(query),
    ]);

    return {
      items,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
    };
  },

  category: async (_, { id }) => {
    const category = await Category.findById(id);
    if (!category) {
      throw new GraphQLError(`Category with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return category;
  },

  categories: async (_, { filters = {}, limit = 50, offset = 0 }) => {
    const query: any = {};

    if (filters?.parent !== undefined) {
      query.parent = filters.parent;
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const [items, total] = await Promise.all([
      Category.find(query).sort({ order: 1, 'name.en': 1 }).skip(offset).limit(limit),
      Category.countDocuments(query),
    ]);

    return { items, total };
  },

  tag: async (_, { id }) => {
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new GraphQLError(`Tag with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return tag;
  },

  tags: async (_, { filters = {}, limit = 100, offset = 0 }) => {
    const query: any = {};

    if (filters?.lang) {
      query.lang = filters.lang;
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const [items, total] = await Promise.all([
      Tag.find(query).sort({ name: 1 }).skip(offset).limit(limit),
      Tag.countDocuments(query),
    ]);

    return { items, total };
  },

  mediaAsset: async (_, { id }) => {
    const mediaAsset = await MediaAsset.findById(id);
    if (!mediaAsset) {
      throw new GraphQLError(`MediaAsset with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return mediaAsset;
  },

  mediaAssets: async (_, { limit = 20, offset = 0 }) => {
    return MediaAsset.find({ isPublic: true }).sort({ createdAt: -1 }).skip(offset).limit(limit);
  },

  comments: async (_: any, { canonicalSlug, lang = 'en', limit = 20, offset = 0 }: any) => {
    // Validate language
    const validLangs = ['en', 'te', 'hi', 'kn'];
    if (!validLangs.includes(lang)) {
      throw new GraphQLError(
        `Invalid language code '${lang}'. Supported: ${validLangs.join(', ')}`,
        {
          extensions: { code: 'INVALID_LANGUAGE' },
        }
      );
    }

    // Verify content exists and is published
    const content = await Content.findOne({
      canonicalSlug,
      status: 'published',
    }).lean();

    if (!content) {
      throw new GraphQLError(`Content with slug '${canonicalSlug}' not found`, {
        extensions: { code: 'CONTENT_NOT_FOUND' },
      });
    }

    // Check if the content has the requested language
    if (!content.translations[lang]) {
      throw new GraphQLError(`Content '${canonicalSlug}' not available in language '${lang}'`, {
        extensions: {
          code: 'TRANSLATION_NOT_FOUND',
          availableLanguages: Object.keys(content.translations),
        },
      });
    }

    // Validate pagination parameters
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    // Build query for approved comments only
    const query = {
      canonicalSlug,
      lang,
      status: 'approved',
    };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Comment.find(query).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
      Comment.countDocuments(query),
    ]);

    return {
      items,
      total,
    };
  },

  search: async (
    _: any,
    args: {
      filters: {
        keyword?: string | null;
        category?: string | null;
        contentType?: string | null;
        lang?: string | null;
      };
      limit: number;
      offset: number;
    }
  ) => {
    try {
      const { keyword, category, contentType, lang = 'en' } = args.filters || {};
      const { limit, offset } = args;

      // Build base query
      let query: any = {
        status: 'published',
      };

      // Add text search if keyword is provided
      if (keyword && keyword.trim()) {
        // For category searches, try text search first, then fallback to title search
        if (category && category !== 'All') {
          // Try combining text search with category filter
          const textQuery = { ...query, $text: { $search: keyword.trim() } };
          const textResults = await Content.find(textQuery).lean();

          if (textResults.length === 0) {
            // Fallback to title search if text search fails
            console.log('⚠️ Text search failed, falling back to title search');
            const titleSearchQuery = {
              ...query,
              $or: [
                ...(query.$or || []),
                { 'translations.en.title': { $regex: keyword.trim(), $options: 'i' } },
                { 'translations.te.title': { $regex: keyword.trim(), $options: 'i' } },
                { 'translations.hi.title': { $regex: keyword.trim(), $options: 'i' } },
                { 'translations.kn.title': { $regex: keyword.trim(), $options: 'i' } },
              ],
            };
            query.$or = titleSearchQuery.$or;
          } else {
            query.$text = { $search: keyword.trim() };
          }
        } else {
          query.$text = { $search: keyword.trim() };
        }
      }

      // Add content type filter if specified
      if (contentType) {
        query.contentType = contentType.toLowerCase();
      } else if (category && category !== 'All') {
        // Map frontend categories to MongoDB ObjectIds and content types
        const categoryMapping: Record<string, { contentType: string; categoryIds?: string[] }> = {
          stotras: { contentType: 'stotra' },
          sahasranamam: {
            contentType: 'stotra',
            categoryIds: ['68ac2239bfcc70ec4468aa89', '68dce4a832e525e497f29abc'], // Sahasranama Stotra IDs
          },
          ashtottara_shatanamavali: {
            contentType: 'stotra',
            categoryIds: ['68ac2239bfcc70ec4468aa8c'], // Ashtottara Shatanamavali ID
          },
          sahasranamavali: {
            contentType: 'stotra',
            categoryIds: ['68ac2239bfcc70ec4468aa8f'], // Sahasranamavali ID
          },
          articles: { contentType: 'article' },
        };

        const mapping = categoryMapping[category];
        if (mapping) {
          query.contentType = mapping.contentType;

          // Add category filtering for stotras by ObjectIds
          if (mapping.categoryIds && mapping.contentType === 'stotra') {
            const categoryObjectIds = mapping.categoryIds.map(
              id => new mongoose.Types.ObjectId(id)
            );

            // Search in any category field (typeIds, devaIds, byNumberIds)
            query.$or = [
              { 'categories.typeIds': { $in: categoryObjectIds } },
              { 'categories.devaIds': { $in: categoryObjectIds } },
              { 'categories.byNumberIds': { $in: categoryObjectIds } },
            ];

            console.log(
              `🏷️ Category filter applied: ${category} with ObjectIds:`,
              categoryObjectIds
            );
          }
        }
      }

      // Execute search with pagination
      const [results, totalCount] = await Promise.all([
        Content.find(query)
          .sort(keyword ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
          .skip(offset)
          .limit(limit)
          .lean(),
        Content.countDocuments(query),
      ]);

      // Transform results for frontend
      const transformedResults = results.map((content: any) => {
        // Get translation for the requested language or fallback
        const translation =
          content.translations[lang || 'en'] ||
          content.translations.en ||
          content.translations.te ||
          content.translations.hi ||
          content.translations.kn ||
          Object.values(content.translations)[0];

        // Handle image URL
        let imageUrl = null;
        if (translation?.videoId) {
          imageUrl = `https://i.ytimg.com/vi/${translation.videoId}/hq720.jpg`;
        } else if (content.imageUrl) {
          imageUrl = content.imageUrl;
        }

        // Get categories as strings (simplified for now)
        const categories: string[] = [];
        if (content.categories?.typeIds?.length) {
          categories.push(content.contentType);
        }

        return {
          id: content._id.toString(),
          contentType: content.contentType.toUpperCase(),
          canonicalSlug: content.canonicalSlug,
          title: translation?.title || content.stotraTitle || 'Untitled',
          description: translation?.stotraMeaning || translation?.body?.substring(0, 200) || '',
          imageUrl,
          categories,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        };
      });

      return {
        results: transformedResults,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new GraphQLError('Search failed', {
        extensions: { code: 'SEARCH_ERROR' },
      });
    }
  },

  content: async (_: any, { canonicalSlug }: { canonicalSlug: string }) => {
    const content = await Content.findOne({
      canonicalSlug,
      status: 'published',
    });

    if (!content) {
      throw new GraphQLError(`Content with slug '${canonicalSlug}' not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return content as any;
  },

  contents: async (
    _: any,
    args: {
      filters?: {
        contentType?: string | null;
        keyword?: string | null;
      } | null;
      limit: number;
      offset: number;
    }
  ) => {
    const { filters = {}, limit = 20, offset = 0 } = args;
    const query: any = { status: 'published' };

    if (filters?.contentType) {
      query.contentType = filters.contentType.toLowerCase();
    }

    if (filters?.keyword) {
      query.$text = { $search: filters.keyword };
    }

    return Content.find(query)
      .sort(filters?.keyword ? { score: { $meta: 'textScore' } } : { updatedAt: -1 })
      .skip(offset)
      .limit(limit) as any;
  },
};
