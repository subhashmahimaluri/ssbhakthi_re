# GraphQL Authentication & Authorization Guide

## Overview

This guide provides comprehensive documentation on authentication and authorization implementation in the SSBhakthi API GraphQL system. It covers Keycloak integration, JWT handling, role-based access control, and security best practices.

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Keycloak Integration](#keycloak-integration)
3. [JWT Token Handling](#jwt-token-handling)
4. [Authorization Patterns](#authorization-patterns)
5. [GraphQL Directives](#graphql-directives)
6. [Middleware Implementation](#middleware-implementation)
7. [Role Management](#role-management)
8. [Security Best Practices](#security-best-practices)
9. [Testing Authentication](#testing-authentication)
10. [Troubleshooting](#troubleshooting)

## Authentication Architecture

### Flow Overview

```
Client Application
       │
       ▼ (1) Login Request
   Keycloak Server
       │
       ▼ (2) JWT Token
Client Application
       │
       ▼ (3) GraphQL Request + JWT
SSBhakthi API Server
       │
       ├── (4) JWT Verification
       ├── (5) JWKS Validation
       ├── (6) User Context Creation
       └── (7) GraphQL Execution
```

### Components

1. **Keycloak Server**: Identity and Access Management
2. **JWT Tokens**: Stateless authentication tokens
3. **JWKS Endpoint**: Public key verification
4. **Auth Middleware**: Token validation and user context
5. **GraphQL Directives**: Declarative authorization
6. **Role Guards**: Function-level access control

## Keycloak Integration

### Configuration

```bash
# Environment variables for Keycloak
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/ssbhakthi
KEYCLOAK_JWKS_URL=https://keycloak.example.com/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app
```

### Keycloak Realm Setup

```json
{
  "realm": "ssbhakthi",
  "clients": [
    {
      "clientId": "admin-app",
      "protocol": "openid-connect",
      "publicClient": false,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "authorizationServicesEnabled": true
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "admin",
        "description": "Administrator with full access"
      },
      {
        "name": "editor",
        "description": "Content editor with publish rights"
      },
      {
        "name": "author",
        "description": "Content author with create/edit rights"
      },
      {
        "name": "user",
        "description": "Regular user with read access"
      }
    ]
  }
}
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-from-jwks"
  },
  "payload": {
    "iss": "https://keycloak.example.com/realms/ssbhakthi",
    "aud": "admin-app",
    "sub": "user-uuid-12345",
    "email": "user@example.com",
    "preferred_username": "john.doe",
    "given_name": "John",
    "family_name": "Doe",
    "realm_access": {
      "roles": ["author", "user"]
    },
    "iat": 1640995200,
    "exp": 1640998800
  }
}
```

## JWT Token Handling

### Token Verification Process

```typescript
// src/auth/jwt.ts

import * as jose from 'jose';

export interface JWTPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export interface User {
  sub: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

/**
 * Verify JWT token using Keycloak JWKS
 */
export async function verifyToken(token: string): Promise<User> {
  try {
    // 1. Create JWKS from Keycloak endpoint
    const JWKS = jose.createRemoteJWKSet(new URL(process.env.KEYCLOAK_JWKS_URL!));

    // 2. Verify token signature and claims
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: process.env.KEYCLOAK_ISSUER,
      audience: process.env.KEYCLOAK_AUDIENCE,
    });

    // 3. Extract user information
    const user: User = {
      sub: payload.sub as string,
      email: payload.email as string,
      username: payload.preferred_username as string,
      firstName: payload.given_name as string,
      lastName: payload.family_name as string,
      roles: (payload as JWTPayload).realm_access?.roles || [],
    };

    return user;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}
```

### Express Middleware

```typescript
/**
 * Express middleware for JWT authentication
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  verifyToken(token)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(error => {
      console.error('Authentication error:', error.message);
      req.user = null;
      next();
    });
}
```

### GraphQL Context

```typescript
// src/app.ts

import { authMiddleware } from './auth/jwt';

// Apply auth middleware to all requests
app.use(authMiddleware);

// GraphQL server with user context
const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  plugins: [
    /* ... */
  ],
});

const { url } = await startStandaloneServer(server, {
  context: async ({ req }) => {
    // Create loaders for efficient data fetching
    const loaders = createLoaders();

    return {
      user: req.user, // User from auth middleware
      loaders,
      req,
    };
  },
  listen: { port: Number(process.env.PORT) || 3001 },
});
```

## Authorization Patterns

### Declarative Authorization

```graphql
# Schema with auth directives
directive @auth on FIELD_DEFINITION
directive @hasRole(roles: [String!]!) on FIELD_DEFINITION

type Query {
  # Public access - no directive needed
  ping: String!
  articles: ArticlesResult!
  article(id: ID!): Article

  # Requires authentication
  me: User @auth

  # Requires specific roles
  adminStats: AdminStats @hasRole(roles: ["admin"])
}

type Mutation {
  # Requires author, editor, or admin role
  createArticle(input: ArticleInput!): Article @hasRole(roles: ["author", "editor", "admin"])

  # Requires editor or admin role
  publishArticle(id: ID!): Article @hasRole(roles: ["editor", "admin"])

  # Requires admin role only
  deleteArticle(id: ID!): Boolean @hasRole(roles: ["admin"])
}
```

### Imperative Authorization

```typescript
// Resolver-level authorization
export const Query: QueryResolvers = {
  async adminStats(parent, args, context) {
    // Check authentication
    if (!context.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    // Check authorization
    if (!context.user.roles.includes('admin')) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    // Business logic
    return getAdminStatistics();
  },
};
```

### Field-level Authorization

```typescript
// Article field resolver with ownership check
export const Article: ArticleResolvers = {
  async bodyHtml(parent, args, context) {
    // Public articles are always accessible
    if (parent.status === 'PUBLISHED') {
      return parent.bodyHtml;
    }

    // Draft articles require authentication
    if (!context.user) {
      throw new GraphQLError('Authentication required for draft content');
    }

    // Authors can see their own drafts
    if (parent.audit.createdBy === context.user.sub) {
      return parent.bodyHtml;
    }

    // Editors and admins can see all drafts
    const hasEditAccess = context.user.roles.some(role => ['editor', 'admin'].includes(role));

    if (!hasEditAccess) {
      throw new GraphQLError('Insufficient permissions for draft content');
    }

    return parent.bodyHtml;
  },
};
```

## GraphQL Directives

### @auth Directive Implementation

```typescript
// src/graphql/resolvers/directives.ts

import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver, GraphQLError, GraphQLSchema } from 'graphql';

/**
 * Transforms schema to add authentication checks to @auth fields
 */
export function authDirective(): (schema: GraphQLSchema) => GraphQLSchema {
  return function authDirectiveTransformer(schema: GraphQLSchema) {
    return mapSchema(schema, {
      [MapperKind.FIELD]: fieldConfig => {
        // Check if field has @auth directive
        const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];

        if (authDirective) {
          const { resolve = defaultFieldResolver } = fieldConfig;

          // Wrap resolver with authentication check
          fieldConfig.resolve = function (source, args, context, info) {
            // Check if user is authenticated
            if (!context.user) {
              throw new GraphQLError('Authentication required', {
                extensions: {
                  code: 'UNAUTHENTICATED',
                  field: info.fieldName,
                },
              });
            }

            // Call original resolver
            return resolve(source, args, context, info);
          };
        }

        return fieldConfig;
      },
    });
  };
}
```

### @hasRole Directive Implementation

```typescript
/**
 * Transforms schema to add role-based authorization to @hasRole fields
 */
export function hasRoleDirective(): (schema: GraphQLSchema) => GraphQLSchema {
  return function hasRoleDirectiveTransformer(schema: GraphQLSchema) {
    return mapSchema(schema, {
      [MapperKind.FIELD]: fieldConfig => {
        // Check if field has @hasRole directive
        const hasRoleDirective = getDirective(schema, fieldConfig, 'hasRole')?.[0];

        if (hasRoleDirective) {
          const { resolve = defaultFieldResolver } = fieldConfig;
          const requiredRoles = hasRoleDirective.roles;

          // Wrap resolver with role check
          fieldConfig.resolve = function (source, args, context, info) {
            // Check authentication first
            if (!context.user) {
              throw new GraphQLError('Authentication required', {
                extensions: {
                  code: 'UNAUTHENTICATED',
                  field: info.fieldName,
                },
              });
            }

            // Check if user has required role
            const hasRequiredRole = requiredRoles.some((role: string) =>
              context.user.roles.includes(role)
            );

            if (!hasRequiredRole) {
              throw new GraphQLError(`Requires one of: ${requiredRoles.join(', ')}`, {
                extensions: {
                  code: 'FORBIDDEN',
                  field: info.fieldName,
                  requiredRoles,
                },
              });
            }

            // Call original resolver
            return resolve(source, args, context, info);
          };
        }

        return fieldConfig;
      },
    });
  };
}
```

### Directive Registration

```typescript
// src/app.ts

import { buildSubgraphSchema } from '@apollo/subgraph';
import { authDirective, hasRoleDirective } from './graphql/resolvers/directives';

// Apply directives to schema
let schema = buildSubgraphSchema({ typeDefs, resolvers });
schema = authDirective()(schema);
schema = hasRoleDirective()(schema);

const server = new ApolloServer({
  schema,
  // ... other configuration
});
```

## Middleware Implementation

### Helper Functions

```typescript
// src/auth/jwt.ts

/**
 * Higher-order function for protecting resolvers
 */
export function requireAuth<T extends any[], R>(resolver: (...args: T) => R): (...args: T) => R {
  return function (source, args, context, info) {
    if (!context.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return resolver(source, args, context, info);
  };
}

/**
 * Higher-order function for role-based protection
 */
export function requireRole<T extends any[], R>(
  roles: string[],
  resolver: (...args: T) => R
): (...args: T) => R {
  return function (source, args, context, info) {
    if (!context.user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const hasRole = roles.some(role => context.user.roles.includes(role));
    if (!hasRole) {
      throw new GraphQLError(`Requires one of: ${roles.join(', ')}`, {
        extensions: {
          code: 'FORBIDDEN',
          requiredRoles: roles,
        },
      });
    }

    return resolver(source, args, context, info);
  };
}
```

### Usage in Resolvers

```typescript
// src/graphql/resolvers/Mutation.ts

export const Mutation: MutationResolvers = {
  // Using directive (preferred)
  async createArticle(parent, { input }, context) {
    // @hasRole directive handles auth, resolver focuses on business logic
    const article = await Article.create({
      ...input,
      audit: {
        createdBy: context.user.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return article;
  },

  // Using helper function (alternative)
  deleteArticle: requireRole(['admin'], async (parent, { id }, context) => {
    await Article.findByIdAndDelete(id);
    return true;
  }),

  // Manual check (when complex logic needed)
  async updateArticle(parent, { id, input }, context) {
    if (!context.user) {
      throw new GraphQLError('Authentication required');
    }

    const article = await Article.findById(id);
    if (!article) {
      throw new GraphQLError('Article not found');
    }

    // Authors can edit their own articles
    const isAuthor = article.audit.createdBy === context.user.sub;

    // Editors and admins can edit any article
    const hasEditRole = context.user.roles.some(role => ['editor', 'admin'].includes(role));

    if (!isAuthor && !hasEditRole) {
      throw new GraphQLError('Insufficient permissions');
    }

    // Update article
    Object.assign(article, input);
    article.audit.updatedBy = context.user.sub;
    article.audit.updatedAt = new Date();

    await article.save();
    return article;
  },
};
```

## Role Management

### Role Hierarchy

```
Admin
  ├── Can do everything
  ├── Manage users and roles
  ├── System configuration
  └── Delete any content

Editor
  ├── Publish/unpublish any content
  ├── Edit any content
  ├── Manage categories and tags
  └── View analytics

Author
  ├── Create new content
  ├── Edit own content
  ├── Submit for review
  └── Upload media

User (Default)
  ├── View published content
  ├── Comment on content
  └── Manage own profile
```

### Role-based Permissions Matrix

| Action                  | User | Author   | Editor | Admin |
| ----------------------- | ---- | -------- | ------ | ----- |
| View published articles | ✅   | ✅       | ✅     | ✅    |
| View draft articles     | ❌   | Own only | ✅     | ✅    |
| Create articles         | ❌   | ✅       | ✅     | ✅    |
| Edit articles           | ❌   | Own only | ✅     | ✅    |
| Publish articles        | ❌   | ❌       | ✅     | ✅    |
| Delete articles         | ❌   | ❌       | ❌     | ✅    |
| Manage categories       | ❌   | ❌       | ✅     | ✅    |
| Manage tags             | ❌   | ❌       | ✅     | ✅    |
| Upload media            | ❌   | ✅       | ✅     | ✅    |
| Manage users            | ❌   | ❌       | ❌     | ✅    |

### Dynamic Role Checking

```typescript
// Role utility functions
export class RoleChecker {
  constructor(private userRoles: string[]) {}

  hasRole(role: string): boolean {
    return this.userRoles.includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.userRoles.includes(role));
  }

  canEdit(): boolean {
    return this.hasAnyRole(['author', 'editor', 'admin']);
  }

  canPublish(): boolean {
    return this.hasAnyRole(['editor', 'admin']);
  }

  canDelete(): boolean {
    return this.hasRole('admin');
  }

  canManageUsers(): boolean {
    return this.hasRole('admin');
  }
}

// Usage in resolvers
export const Article: ArticleResolvers = {
  async canEdit(parent, args, context) {
    if (!context.user) return false;

    const roles = new RoleChecker(context.user.roles);

    // Admins and editors can edit anything
    if (roles.hasAnyRole(['admin', 'editor'])) {
      return true;
    }

    // Authors can edit their own content
    if (roles.hasRole('author')) {
      return parent.audit.createdBy === context.user.sub;
    }

    return false;
  },
};
```

## Security Best Practices

### 1. Token Security

```typescript
// Secure token handling
export async function verifyToken(token: string): Promise<User> {
  // Always verify signature
  const { payload } = await jose.jwtVerify(token, JWKS, {
    issuer: process.env.KEYCLOAK_ISSUER,
    audience: process.env.KEYCLOAK_AUDIENCE,
    // Check token age
    maxTokenAge: '1h',
    // Verify critical claims
    requiredClaims: ['sub', 'iss', 'aud', 'exp'],
  });

  // Additional validation
  if (!payload.sub) {
    throw new Error('Token missing subject claim');
  }

  return extractUser(payload);
}
```

### 2. Rate Limiting

```typescript
// Rate limiting for GraphQL
import rateLimit from 'express-rate-limit';

const graphqlRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many GraphQL requests',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/graphql', graphqlRateLimit);
```

### 3. Query Complexity Analysis

```typescript
// Protect against complex queries
import depthLimit from 'graphql-depth-limit';
import costAnalysis from 'graphql-cost-analysis';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // Limit query depth
    depthLimit(Number(process.env.GRAPHQL_MAX_DEPTH) || 8),

    // Analyze query cost
    costAnalysis({
      maxCost: Number(process.env.GRAPHQL_MAX_COST) || 15000,
      introspection: true,
      onComplete: (cost: number) => {
        console.log(`Query cost: ${cost}`);
      },
    }),
  ],
});
```

### 4. Input Sanitization

```typescript
// Sanitize inputs
import DOMPurify from 'isomorphic-dompurify';

export const Mutation: MutationResolvers = {
  async createArticle(parent, { input }, context) {
    // Sanitize HTML content
    if (input.bodyHtml?.en) {
      input.bodyHtml.en = DOMPurify.sanitize(input.bodyHtml.en);
    }
    if (input.bodyHtml?.te) {
      input.bodyHtml.te = DOMPurify.sanitize(input.bodyHtml.te);
    }

    // Validate required fields
    if (!input.title?.en && !input.title?.te) {
      throw new GraphQLError('Title required in at least one language');
    }

    // Business logic
    return createArticle(input, context.user);
  },
};
```

### 5. Error Handling

```typescript
// Secure error handling
export function formatError(error: GraphQLError) {
  // Log full error for debugging
  console.error('GraphQL Error:', {
    message: error.message,
    stack: error.stack,
    path: error.path,
    source: error.source,
  });

  // Return safe error to client
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal errors in production
    if (error.extensions?.code === 'INTERNAL_ERROR') {
      return new GraphQLError('Internal server error');
    }
  }

  return error;
}
```

## Testing Authentication

### Mock JWT Tokens

```typescript
// tests/utils/mockAuth.ts

import jwt from 'jsonwebtoken';

export function createMockJWT(payload: Partial<JWTPayload> = {}): string {
  const defaultPayload: JWTPayload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    preferred_username: 'testuser',
    given_name: 'Test',
    family_name: 'User',
    realm_access: { roles: ['user'] },
    iss: process.env.KEYCLOAK_ISSUER!,
    aud: process.env.KEYCLOAK_AUDIENCE!,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign({ ...defaultPayload, ...payload }, process.env.JWT_SECRET || 'test-secret');
}

export const mockTokens = {
  user: createMockJWT({ realm_access: { roles: ['user'] } }),
  author: createMockJWT({ realm_access: { roles: ['author', 'user'] } }),
  editor: createMockJWT({ realm_access: { roles: ['editor', 'author', 'user'] } }),
  admin: createMockJWT({ realm_access: { roles: ['admin', 'editor', 'author', 'user'] } }),
};
```

### Authentication Tests

```typescript
// tests/auth.test.ts

describe('GraphQL Authentication', () => {
  it('should reject unauthenticated requests to protected fields', async () => {
    const query = `{ me { id email } }`;

    const response = await request(app).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('should allow authenticated requests', async () => {
    const query = `{ me { id email } }`;

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.user}`)
      .send({ query })
      .expect(200);

    expect(response.body.data.me).toBeDefined();
    expect(response.body.errors).toBeUndefined();
  });

  it('should enforce role-based access', async () => {
    const mutation = `
      mutation {
        createArticle(input: {
          type: "blog"
          title: { en: "Test" }
          slug: { en: "test" }
          locales: ["en"]
        }) { id }
      }
    `;

    // User without author role should be rejected
    const userResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.user}`)
      .send({ query: mutation })
      .expect(200);

    expect(userResponse.body.errors[0].extensions.code).toBe('FORBIDDEN');

    // Author should be allowed
    const authorResponse = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.author}`)
      .send({ query: mutation })
      .expect(200);

    expect(authorResponse.body.data.createArticle).toBeDefined();
  });
});
```

## Troubleshooting

### Common Issues

1. **Token Verification Fails**

   ```bash
   # Check JWKS endpoint is accessible
   curl https://keycloak.example.com/realms/ssbhakthi/protocol/openid-connect/certs

   # Verify token manually
   echo "TOKEN" | base64 -d | jq
   ```

2. **Role Not Found**

   ```typescript
   // Debug role extraction
   console.log('JWT payload:', payload);
   console.log('Realm access:', payload.realm_access);
   console.log('Roles:', payload.realm_access?.roles);
   ```

3. **CORS Issues**
   ```typescript
   // Add auth headers to CORS
   app.use(
     cors({
       origin: process.env.CORS_ORIGIN?.split(','),
       credentials: true,
       allowedHeaders: ['Content-Type', 'Authorization'],
     })
   );
   ```

### Debug Mode

```bash
# Enable auth debugging
DEBUG=auth:* pnpm run dev

# Test with curl
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"{ me { id email roles } }"}'
```

### Health Checks

```graphql
# Auth health check query
{
  ping # Should always work (public)
}

# Authenticated health check
{
  me {
    # Should work with valid token
    id
    email
    roles
  }
}
```

## Resources

- [JWT.io](https://jwt.io/) - JWT token debugger
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [GraphQL Security Best Practices](https://leapgraph.com/graphql-security-best-practices)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
