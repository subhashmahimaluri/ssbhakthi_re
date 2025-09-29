import { GraphQLError } from 'graphql';
import { Article, ArticleStatus, Category, Comment, Content, MediaAsset, Tag } from '../../models';
import { MutationResolvers } from '../__generated__/types';
import { GraphQLContext } from '../context';

export const Mutation: MutationResolvers<GraphQLContext> = {
  // Article mutations
  createArticle: async (_, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const article = new Article({
      ...input,
      audit: {
        createdBy: user.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await article.save();
    return article;
  },

  updateArticle: async (_, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const article = await Article.findById(id);
    if (!article) {
      throw new GraphQLError(`Article with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Update fields
    Object.assign(article, input);
    article.audit.updatedBy = user.sub;
    article.audit.updatedAt = new Date();

    await article.save();
    return article;
  },

  changeArticleStatus: async (_, { id, status, publishAt }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const article = await Article.findById(id);
    if (!article) {
      throw new GraphQLError(`Article with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    article.status = status as unknown as ArticleStatus;
    if (publishAt) {
      if (!article.schedule) {
        article.schedule = {};
      }
      article.schedule.publishAt = publishAt;
    }
    article.audit.updatedBy = user.sub;
    article.audit.updatedAt = new Date();

    await article.save();
    return article;
  },

  deleteArticle: async (_, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const result = await Article.findByIdAndDelete(id);
    return !!result;
  },

  // Category mutations
  createCategory: async (_, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const category = new Category({
      ...input,
      createdBy: user.sub,
    });

    await category.save();
    return category;
  },

  updateCategory: async (_, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { ...input, updatedAt: new Date() },
      { new: true }
    );

    if (!category) {
      throw new GraphQLError(`Category with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return category;
  },

  deleteCategory: async (_, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const result = await Category.findByIdAndDelete(id);
    return !!result;
  },

  // Tag mutations
  createTag: async (_, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const tag = new Tag({
      ...input,
      createdBy: user.sub,
    });

    await tag.save();
    return tag;
  },

  updateTag: async (_, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const tag = await Tag.findByIdAndUpdate(id, { ...input, updatedAt: new Date() }, { new: true });

    if (!tag) {
      throw new GraphQLError(`Tag with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return tag;
  },

  deleteTag: async (_, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const result = await Tag.findByIdAndDelete(id);
    return !!result;
  },

  // Media mutations
  createMediaAsset: async (_, { input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const mediaAsset = new MediaAsset({
      ...input,
      uploadedBy: user.sub,
    });

    await mediaAsset.save();
    return mediaAsset;
  },

  updateMediaAsset: async (_, { id, input }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const mediaAsset = await MediaAsset.findByIdAndUpdate(
      id,
      { ...input, updatedAt: new Date() },
      { new: true }
    );

    if (!mediaAsset) {
      throw new GraphQLError(`MediaAsset with ID ${id} not found`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return mediaAsset;
  },

  deleteMediaAsset: async (_, { id }, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const result = await MediaAsset.findByIdAndDelete(id);
    return !!result;
  },

  // Comment mutations
  addComment: async (_: any, { canonicalSlug, lang, text }: any, { user }: any) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

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

    // Validate text
    const trimmedText = text.trim();
    if (trimmedText.length === 0 || trimmedText.length > 2000) {
      throw new GraphQLError('Comment text must be between 1 and 2000 characters', {
        extensions: { code: 'INVALID_TEXT_LENGTH' },
      });
    }

    // Find the content and verify it exists
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

    // Extract user information for the comment
    const userName = user.preferred_username || user.email?.split('@')[0] || 'Anonymous User';

    // Create new comment
    const newComment = new Comment({
      contentId: content._id,
      canonicalSlug,
      lang,
      userId: user.sub,
      userName,
      userEmail: user.email,
      text: trimmedText,
      status: 'approved', // Default to approved as per requirements
    });

    const savedComment = await newComment.save();
    return savedComment;
  },
};
