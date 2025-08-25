import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError, GraphQLFieldConfig, GraphQLSchema } from 'graphql';
import { hasAnyRole } from '../auth/jwt';
import { GraphQLContext } from './context';

// Auth directive transformer
export function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (source, args, context: GraphQLContext, info) {
          if (!context.user) {
            throw new GraphQLError('Authentication required', {
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            });
          }

          return resolve(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}

// HasRole directive transformer
export function hasRoleDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig: GraphQLFieldConfig<any, any>) => {
      const hasRoleDirective = getDirective(schema, fieldConfig, 'hasRole')?.[0];

      if (hasRoleDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        const requiredRoles = hasRoleDirective['roles'] as string[];

        fieldConfig.resolve = async function (source, args, context: GraphQLContext, info) {
          if (!context.user) {
            throw new GraphQLError('Authentication required', {
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            });
          }

          if (!hasAnyRole(context.user, requiredRoles)) {
            throw new GraphQLError(`Access denied. Required roles: ${requiredRoles.join(', ')}`, {
              extensions: {
                code: 'FORBIDDEN',
                requiredRoles,
                userRoles: context.user.roles,
              },
            });
          }

          return resolve(source, args, context, info);
        };
      }

      return fieldConfig;
    },
  });
}

// Combined directive transformer
export function applyDirectiveTransformers(schema: GraphQLSchema): GraphQLSchema {
  let transformedSchema = schema;
  transformedSchema = authDirectiveTransformer(transformedSchema);
  transformedSchema = hasRoleDirectiveTransformer(transformedSchema);
  return transformedSchema;
}
