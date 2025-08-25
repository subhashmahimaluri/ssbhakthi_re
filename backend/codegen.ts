import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './src/graphql/schema.graphql',
  generates: {
    './src/graphql/__generated__/types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        contextType: '../context#GraphQLContext',
        mappers: {
          Article: '../../../models/Article#IArticle',
          User: '../../../models/User#IUser',
          Category: '../../../models/Category#ICategory',
          Tag: '../../../models/Tag#ITag',
          MediaAsset: '../../../models/MediaAsset#IMediaAsset',
        },
        scalars: {
          DateTime: 'Date',
          JSON: 'Record<string, any>',
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
