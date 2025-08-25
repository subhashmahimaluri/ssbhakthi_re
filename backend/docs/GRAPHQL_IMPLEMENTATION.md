# GraphQL Implementation Guide

## Overview

This document provides a comprehensive guide to the GraphQL implementation in the SSBhakthi API project. It covers the complete architecture, implementation details, and development workflows for new developers joining the team.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Implementation Details](#implementation-details)
5. [Getting Started](#getting-started)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Security Implementation](#security-implementation)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

### GraphQL + REST Hybrid Architecture

The SSBhakthi API implements a hybrid architecture combining GraphQL and REST endpoints:

```
Client Applications
       │
       ▼
   Load Balancer
       │
       ▼
Express.js Server (Port 3001)
       │
       ├── GraphQL API (/graphql)
       │   ├── Apollo Server 4.0
       │   ├── Schema-First Approach
       │   ├── Authentication Middleware
       │   └── DataLoader for Performance
       │
       └── REST API (/rest/*)
           ├── Health Check (/rest/health)
           ├── Media Upload (/rest/media/upload)
           └── Legacy Endpoints
       │
       ▼
   Database Layer
       ├── MongoDB (Primary Data)
       ├── Redis (Caching/Sessions)
       └── Mongoose ODM
```

### Key Design Principles

1. **Schema-First Development**: GraphQL schema defines the API contract
2. **Type Safety**: Full TypeScript integration with auto-generated types
3. **Security by Design**: Authentication, authorization, and query limiting
4. **Performance Optimized**: DataLoader pattern for efficient database queries
5. **Developer Experience**: GraphQL Playground, hot reload, comprehensive testing

## Technology Stack

### Core Technologies

| Technology        | Version | Purpose                       |
| ----------------- | ------- | ----------------------------- |
| **Node.js**       | v18+    | Runtime environment           |
| **TypeScript**    | v5.x    | Type-safe JavaScript          |
| **Express.js**    | v4.x    | Web framework                 |
| **Apollo Server** | v4.0    | GraphQL server implementation |
| **GraphQL**       | v16.x   | Query language and runtime    |
| **Mongoose**      | v7.x    | MongoDB ODM                   |
| **MongoDB**       | v6.x    | Primary database              |
| **Redis**         | v7.x    | Caching and sessions          |

### Authentication & Security

| Technology                | Purpose                        |
| ------------------------- | ------------------------------ |
| **Keycloak**              | Identity and access management |
| **jose**                  | JWT token verification         |
| **JWKS**                  | JSON Web Key Set validation    |
| **GraphQL Depth Limit**   | Query complexity protection    |
| **GraphQL Cost Analysis** | Query cost limitation          |

### Development Tools

| Tool                       | Purpose                        |
| -------------------------- | ------------------------------ |
| **GraphQL Code Generator** | Auto-generate TypeScript types |
| **Vitest**                 | Testing framework              |
| **Supertest**              | HTTP testing                   |
| **ESLint**                 | Code linting                   |
| **Prettier**               | Code formatting                |
| **Docker Compose**         | Development environment        |

## Project Structure

```
src/
├── graphql/                          # GraphQL Implementation
│   ├── schema.graphql                # SDL Schema Definition
│   ├── resolvers/                    # GraphQL Resolvers
│   │   ├── Query.ts                  # Query resolvers
│   │   ├── Mutation.ts               # Mutation resolvers
│   │   ├── Article.ts                # Article field resolvers
│   │   ├── scalars.ts                # Custom scalar types
│   │   ├── loaders.ts                # DataLoader instances
│   │   └── directives.ts             # Auth directive transformers
│   └── __generated__/                # Auto-generated files
│       └── types.ts                  # TypeScript type definitions
├── auth/                             # Authentication Layer
│   └── jwt.ts                        # Keycloak JWT middleware
├── models/                           # Mongoose Data Models
│   ├── Article.ts                    # Article model with audit
│   ├── Category.ts                   # Category with localization
│   ├── Tag.ts                        # Tag with language support
│   ├── MediaAsset.ts                 # Media asset model
│   └── User.ts                       # User with Keycloak integration
├── routes/                           # REST API Routes
│   ├── health.ts                     # Health check endpoint
│   └── media.ts                      # Media upload endpoint
├── config/                           # Configuration
│   ├── app.ts                        # Application configuration
│   └── database.ts                   # Database connection
├── middleware/                       # Express Middlewares
│   └── error.ts                      # Error handling
└── types/                            # TypeScript Definitions
    └── config.ts                     # Configuration types
```

## Implementation Details

### GraphQL Schema Design

The GraphQL schema follows these conventions:

1. **Naming**: PascalCase for types, camelCase for fields
2. **Localization**: `LocaleString` type for multi-language content
3. **Enums**: UPPER_SNAKE_CASE for enum values
4. **Directives**: `@auth` and `@hasRole` for security
5. **Pagination**: Cursor-based with `hasNextPage`/`hasPreviousPage`

### Type System

```graphql
# Core Types
scalar DateTime
scalar JSON

type LocaleString {
  en: String
  te: String
}

enum ArticleStatus {
  DRAFT
  REVIEW
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

# Business Entities
type Article {
  id: ID!
  type: String!
  title: LocaleString!
  slug: LocaleString!
  summary: LocaleString
  bodyHtml: LocaleString
  cover: MediaAsset
  categories: [Category!]!
  tags: [Tag!]!
  locales: [String!]!
  status: ArticleStatus!
  revision: Int!
  audit: AuditInfo!
}
```

### Resolver Implementation Pattern

All resolvers follow a consistent pattern:

```typescript
// Query Resolver Pattern
export const Query: QueryResolvers = {
  async articles(parent, args, context) {
    // 1. Input validation
    const { filters, limit = 20, offset = 0, sort } = args;

    // 2. Build database query
    const query = buildArticleQuery(filters);

    // 3. Execute with pagination
    const [items, total] = await Promise.all([
      Article.find(query).limit(limit).skip(offset).sort(parseSortString(sort)),
      Article.countDocuments(query),
    ]);

    // 4. Return paginated result
    return {
      items,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
    };
  },
};
```

### Authentication Flow

```typescript
// 1. JWT Token Extraction
const token = req.headers.authorization?.replace('Bearer ', '');

// 2. JWKS Verification
const jwks = await jose.createRemoteJWKSet(new URL(process.env.KEYCLOAK_JWKS_URL!));

// 3. Token Validation
const { payload } = await jose.jwtVerify(token, jwks, {
  issuer: process.env.KEYCLOAK_ISSUER,
  audience: process.env.KEYCLOAK_AUDIENCE,
});

// 4. User Context Creation
const user = {
  sub: payload.sub as string,
  email: payload.email as string,
  roles: payload.realm_access?.roles || [],
};

// 5. Request Context Attachment
req.user = user;
```

## Getting Started

### Prerequisites

1. **Node.js v18+** installed
2. **pnpm** package manager
3. **Docker & Docker Compose** for databases
4. **Keycloak instance** (for production authentication)

### Initial Setup

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd ssbhakthi_api
pnpm install

# 2. Environment configuration
cp .env.example .env
# Edit .env with your configuration

# 3. Start databases
pnpm run docker:dev

# 4. Generate GraphQL types
pnpm run codegen

# 5. Start development server
pnpm run dev
```

### Environment Configuration

Key environment variables for GraphQL:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin
REDIS_URL=redis://:devpassword123@localhost:6379

# GraphQL Configuration
GRAPHQL_PLAYGROUND=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COST=15000
GRAPHQL_INTROSPECTION=true

# Keycloak Authentication
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/ssbhakthi
KEYCLOAK_JWKS_URL=https://keycloak.example.com/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app
```

### Verification Steps

After setup, verify the installation:

```bash
# 1. Check health endpoint
curl http://localhost:3001/rest/health

# 2. Test GraphQL ping
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ping }"}'

# 3. Access GraphQL Playground
open http://localhost:3001/graphql

# 4. Run tests
pnpm run test
```

## Development Workflow

### Schema-First Development Process

1. **Define Schema**: Edit `src/graphql/schema.graphql`
2. **Generate Types**: Run `pnpm run codegen`
3. **Implement Resolvers**: Add to appropriate resolver files
4. **Test in Playground**: Use GraphQL Playground for testing
5. **Write Tests**: Add to `tests/graphql-api.test.ts`
6. **Update Documentation**: Update this documentation

### Adding New Types

```graphql
# 1. Define in schema.graphql
type NewEntity {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime!
}

extend type Query {
  newEntity(id: ID!): NewEntity
  newEntities(limit: Int = 20): [NewEntity!]!
}
```

```typescript
// 2. Create Mongoose model
export interface INewEntity extends Document {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

const NewEntitySchema = new Schema<INewEntity>(
  {
    name: { type: String, required: true },
    description: String,
  },
  { timestamps: true }
);

export const NewEntity = mongoose.model<INewEntity>('NewEntity', NewEntitySchema);
```

```typescript
// 3. Implement resolvers
export const Query: QueryResolvers = {
  async newEntity(parent, { id }, context) {
    return await NewEntity.findById(id);
  },

  async newEntities(parent, { limit }, context) {
    return await NewEntity.find().limit(limit);
  },
};
```

### Adding Authentication

```graphql
# 1. Add directive to schema
type Query {
  protectedData: String @auth
  adminOnlyData: String @hasRole(roles: ["admin"])
}
```

```typescript
// 2. Resolver implementation (no changes needed)
export const Query: QueryResolvers = {
  async protectedData(parent, args, context) {
    // Authentication handled by directive
    return 'Protected data';
  },
};
```

## Testing Strategy

### Test Structure

```
tests/
├── graphql-api.test.ts       # Main GraphQL API tests
├── auth.test.ts              # Authentication tests
├── resolvers/                # Individual resolver tests
│   ├── query.test.ts
│   ├── mutation.test.ts
│   └── article.test.ts
└── utils/                    # Test utilities
    ├── setup.ts
    ├── mockAuth.ts
    └── testData.ts
```

### Testing Patterns

```typescript
// Authentication Testing
describe('GraphQL Authentication', () => {
  it('should require authentication for protected queries', async () => {
    const query = `{ me { id email } }`;

    const response = await request(app).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors[0].message).toContain('Authentication required');
  });

  it('should allow authenticated requests', async () => {
    const token = generateTestJWT({ roles: ['user'] });
    const query = `{ me { id email } }`;

    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query })
      .expect(200);

    expect(response.body.data.me).toBeDefined();
  });
});
```

### Mock Authentication

```typescript
// Test JWT generation
export function generateTestJWT(payload: Partial<JWTPayload>) {
  return jwt.sign(
    {
      sub: '12345',
      email: 'test@example.com',
      realm_access: { roles: ['user'] },
      ...payload,
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}
```

## Security Implementation

### Authentication Middleware

The JWT authentication middleware handles:

1. **Token Extraction**: From Authorization header
2. **JWKS Verification**: Using Keycloak's public keys
3. **Token Validation**: Issuer, audience, expiration checks
4. **User Context**: Attaching user info to request

### Authorization Directives

```typescript
// @auth directive implementation
export function authDirective() {
  return function authDirectiveTransformer(schema: GraphQLSchema) {
    return mapSchema(schema, {
      [MapperKind.FIELD]: fieldConfig => {
        const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
        if (authDirective) {
          const { resolve = defaultFieldResolver } = fieldConfig;
          fieldConfig.resolve = function (source, args, context, info) {
            if (!context.user) {
              throw new GraphQLError('Authentication required', {
                extensions: { code: 'UNAUTHENTICATED' },
              });
            }
            return resolve(source, args, context, info);
          };
        }
        return fieldConfig;
      },
    });
  };
}
```

### Query Security

```typescript
// Depth and cost limiting
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    depthLimit(Number(process.env.GRAPHQL_MAX_DEPTH) || 8),
    costAnalysis({
      maxCost: Number(process.env.GRAPHQL_MAX_COST) || 15000,
    }),
  ],
});
```

## Performance Optimization

### DataLoader Implementation

```typescript
// Efficient data loading
export function createLoaders() {
  return {
    categoriesById: new DataLoader(async (ids: readonly string[]) => {
      const categories = await Category.find({ _id: { $in: ids } });
      return ids.map(id => categories.find(cat => cat.id === id) || null);
    }),

    tagsById: new DataLoader(async (ids: readonly string[]) => {
      const tags = await Tag.find({ _id: { $in: ids } });
      return ids.map(id => tags.find(tag => tag.id === id) || null);
    }),
  };
}
```

### Database Optimization

```typescript
// Optimized indexes in Mongoose models
ArticleSchema.index({ status: 1, 'audit.updatedAt': -1 });
ArticleSchema.index({ type: 1, status: 1 });
ArticleSchema.index({ categories: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ 'slug.en': 1 }, { unique: true, sparse: true });
```

## Troubleshooting

### Common Issues

1. **GraphQL Playground not loading**
   - Check `GRAPHQL_PLAYGROUND=true` in `.env`
   - Verify server is running on correct port

2. **Authentication errors**
   - Verify Keycloak JWKS URL is accessible
   - Check JWT token format and claims

3. **Type generation issues**
   - Run `pnpm run codegen` after schema changes
   - Check for GraphQL syntax errors

4. **Database connection errors**
   - Ensure MongoDB container is running
   - Check connection string format

### Debug Mode

Enable debug logging:

```bash
DEBUG=apollo:* pnpm run dev
```

### Health Checks

Monitor application health:

```bash
# API Health
curl http://localhost:3001/rest/health

# GraphQL Ping
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ping }"}'
```

## Next Steps

1. **Extend Schema**: Add more business entities
2. **Implement Subscriptions**: Real-time updates
3. **Add Caching**: Redis-based query caching
4. **Monitoring**: Add GraphQL metrics and tracing
5. **Documentation**: Auto-generate API documentation

For specific implementation guides, see:

- [GraphQL Schema Design Guide](./GRAPHQL_SCHEMA_DESIGN.md)
- [Authentication & Authorization Guide](./GRAPHQL_AUTH_GUIDE.md)
- [Performance Optimization Guide](./GRAPHQL_PERFORMANCE.md)
- [Testing Best Practices](./GRAPHQL_TESTING.md)
