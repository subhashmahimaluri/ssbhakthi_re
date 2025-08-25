import { GraphQLError } from 'graphql';
import { Article, Category, MediaAsset, Tag, User } from '../../models';
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
};
