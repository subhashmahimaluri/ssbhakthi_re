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
          Article: '../../models#IArticle',
          User: '../../models#IUser',
          Category: '../../models#ICategory',
          Tag: '../../models#ITag',
          MediaAsset: '../../models#IMediaAsset',
          Comment: '../../models#IComment',
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
