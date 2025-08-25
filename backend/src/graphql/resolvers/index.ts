import { Resolvers } from '../__generated__/types';
import { GraphQLContext } from '../context';
import { DateTimeScalar, JSONScalar } from '../scalars';
import { Mutation } from './Mutation';
import { Query } from './Query';

export const resolvers: Resolvers<GraphQLContext> = {
  // Custom scalars
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  // Root resolvers
  Query,
  Mutation,

  // Field resolvers
  Article: {
    cover: async (parent, _, { dataloaders }) => {
      if (!parent.cover) return null;
      return dataloaders.mediaAssetById.load(parent.cover);
    },
    categories: async (parent, _, { dataloaders }) => {
      if (!parent.categories || parent.categories.length === 0) return [];
      return dataloaders.categoriesByIds.load(parent.categories);
    },
    tags: async (parent, _, { dataloaders }) => {
      if (!parent.tags || parent.tags.length === 0) return [];
      return dataloaders.tagsByIds.load(parent.tags);
    },
  },

  Category: {
    parent: async (parent, _, { dataloaders }) => {
      if (!parent.parent) return null;
      return dataloaders.categoryById.load(parent.parent);
    },
  },

  MediaAsset: {
    // Add any computed fields if needed
  },

  Tag: {
    // Add any computed fields if needed
  },

  User: {
    // Add any computed fields if needed
  },
};
