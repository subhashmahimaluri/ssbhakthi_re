# Developer Onboarding Guide

## Welcome to SSBhakthi API

This comprehensive guide will help new developers get up to speed with the GraphQL implementation in the SSBhakthi API project. Follow this step-by-step guide for a smooth onboarding experience.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js v18+** installed
- [ ] **pnpm v8+** package manager
- [ ] **Docker & Docker Compose** for development databases
- [ ] **Git** version control
- [ ] **VS Code** (recommended) with GraphQL extensions
- [ ] **Postman** or **Insomnia** for API testing (optional)

## 🚀 Quick Start (30 Minutes)

### Step 1: Environment Setup (5 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd ssbhakthi_api

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Edit .env file with your settings
code .env
```

**Important Environment Variables:**

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin
REDIS_URL=redis://:devpassword123@localhost:6379

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COST=15000

# Keycloak (for authentication)
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/ssbhakthi
KEYCLOAK_JWKS_URL=https://keycloak.example.com/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app
```

### Step 2: Start Development Environment (10 minutes)

```bash
# Start databases with Docker Compose
pnpm run docker:dev

# Wait for databases to be ready (check logs)
pnpm run docker:logs

# Generate GraphQL types from schema
pnpm run codegen

# Start development server
pnpm run dev
```

**Verify Setup:**

- API Server: http://localhost:3001
- GraphQL Playground: http://localhost:3001/graphql
- Health Check: http://localhost:3001/rest/health
- MongoDB Admin: http://localhost:8082 (admin/admin)
- Redis Admin: http://localhost:8081

### Step 3: Test Your Setup (10 minutes)

```bash
# Test health endpoint
curl http://localhost:3001/rest/health

# Test GraphQL ping
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ ping }"}'

# Run tests to verify everything works
pnpm test
```

### Step 4: Explore GraphQL Playground (5 minutes)

Open http://localhost:3001/graphql and try these queries:

```graphql
# Simple ping test
{
  ping
}

# Get articles with relationships
{
  articles(limit: 5) {
    items {
      id
      title {
        en
        te
      }
      categories {
        name {
          en
          te
        }
      }
    }
    total
  }
}
```

## 🏗️ Architecture Overview

### Technology Stack

```
Frontend Apps
    ↓
GraphQL API (Apollo Server)
    ↓
Express.js Middleware
    ↓
MongoDB (Mongoose) + Redis
```

### Key Components

- **GraphQL Schema**: `src/graphql/schema.graphql` - API contract
- **Resolvers**: `src/graphql/resolvers/` - Business logic
- **Models**: `src/models/` - Database entities
- **Authentication**: `src/auth/jwt.ts` - Keycloak integration
- **DataLoaders**: Efficient data fetching patterns

## 📚 Learning Path

### Week 1: GraphQL Fundamentals

**Day 1-2: Understanding the Schema**

1. Read [`GRAPHQL_SCHEMA_DESIGN.md`](./GRAPHQL_SCHEMA_DESIGN.md)
2. Explore `src/graphql/schema.graphql`
3. Practice queries in GraphQL Playground

**Key Learning Points:**

- GraphQL type system (scalars, objects, enums)
- LocaleString pattern for internationalization
- Directive usage (@auth, @hasRole)
- Input types and validation

**Hands-on Exercise:**

```graphql
# Try different query variations
{
  articles(filters: { type: "blog", status: PUBLISHED }) {
    items {
      title {
        en
        te
      }
      summary {
        en
        te
      }
      categories {
        name {
          en
        }
      }
      tags {
        name
        lang
      }
    }
  }
}
```

**Day 3-4: Authentication & Authorization**

1. Read [`GRAPHQL_AUTH_GUIDE.md`](./GRAPHQL_AUTH_GUIDE.md)
2. Study `src/auth/jwt.ts`
3. Understand role-based access control

**Practice Exercise:**

```bash
# Generate test JWT token
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  sub: 'test-user',
  email: 'test@example.com',
  realm_access: { roles: ['author'] }
}, 'test-secret');
console.log(token);
"

# Test authenticated query
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"{ me { id email roles } }"}'
```

**Day 5: Resolvers and DataLoaders**

1. Study resolver patterns in `src/graphql/resolvers/`
2. Understand DataLoader usage
3. Learn about N+1 query problem

**Code Reading Exercise:**

- `src/graphql/resolvers/Query.ts` - Query resolvers
- `src/graphql/resolvers/Article.ts` - Field resolvers
- `src/graphql/resolvers/loaders.ts` - DataLoader implementation

### Week 2: Implementation Patterns

**Day 1-2: Database Integration**

1. Study Mongoose models in `src/models/`
2. Understand indexing strategy
3. Learn audit trail implementation

**Practical Task:**

```typescript
// Add a new field to Article model
// Update GraphQL schema
// Implement resolver
// Run tests
```

**Day 3-4: Testing Strategies**

1. Read [`GRAPHQL_TESTING.md`](./GRAPHQL_TESTING.md)
2. Study existing tests in `tests/`
3. Learn mock data patterns

**Testing Exercise:**

```bash
# Run specific test file
pnpm test graphql-api.test.ts

# Run with coverage
pnpm test:coverage

# Write a new test for a resolver
```

**Day 5: Performance Optimization**

1. Read [`GRAPHQL_PERFORMANCE.md`](./GRAPHQL_PERFORMANCE.md)
2. Study DataLoader effectiveness
3. Understand query optimization

### Week 3: Advanced Topics

**Day 1-2: Security Best Practices**

- Query depth and cost limiting
- Input validation and sanitization
- Error handling patterns

**Day 3-4: Monitoring and Debugging**

- Performance metrics collection
- Slow query identification
- Error tracking

**Day 5: Deployment and Production**

- Environment configuration
- Security hardening
- Performance monitoring

## 🛠️ Development Workflow

### Daily Development Process

```bash
# 1. Start development environment
pnpm run docker:dev
pnpm run dev

# 2. Make schema changes
# Edit src/graphql/schema.graphql

# 3. Generate types
pnpm run codegen

# 4. Implement resolvers
# Edit files in src/graphql/resolvers/

# 5. Test your changes
pnpm test
# Use GraphQL Playground for manual testing

# 6. Code quality checks
pnpm run lint
pnpm run format:check
```

### Making Your First Change

**Exercise: Add a `views` field to Articles**

1. **Update Schema** (`src/graphql/schema.graphql`):

```graphql
type Article {
  # ... existing fields
  views: Int!
}
```

2. **Update Model** (`src/models/Article.ts`):

```typescript
export interface IArticle extends Document {
  // ... existing fields
  views: number;
}

const ArticleSchema = new Schema<IArticle>({
  // ... existing fields
  views: { type: Number, default: 0 },
});
```

3. **Generate Types**:

```bash
pnpm run codegen
```

4. **Test Your Change**:

```graphql
{
  articles {
    items {
      id
      title {
        en
      }
      views
    }
  }
}
```

5. **Write a Test**:

```typescript
it('should return article views', async () => {
  const article = await Article.create({
    ...createMockArticle(),
    views: 42,
  });

  const result = await Query.article(null, { id: article.id }, context, {} as any);
  expect(result.views).toBe(42);
});
```

## 🔧 Common Development Tasks

### Adding a New Query

1. **Define in Schema**:

```graphql
extend type Query {
  featuredArticles(limit: Int = 5): [Article!]!
}
```

2. **Implement Resolver**:

```typescript
// src/graphql/resolvers/Query.ts
export const Query: QueryResolvers = {
  async featuredArticles(parent, { limit }, context) {
    return await Article.find({
      status: 'PUBLISHED',
      featured: true,
    })
      .limit(limit)
      .sort({ 'audit.updatedAt': -1 });
  },
};
```

3. **Add Tests**:

```typescript
it('should return featured articles', async () => {
  await Article.create([
    createMockArticle({ featured: true }),
    createMockArticle({ featured: false }),
  ]);

  const result = await Query.featuredArticles(null, { limit: 5 }, context, {} as any);
  expect(result).toHaveLength(1);
});
```

### Adding Authentication to a Field

1. **Add Directive to Schema**:

```graphql
type Query {
  adminStats: AdminStats @hasRole(roles: ["admin"])
}
```

2. **Implement Resolver** (directive handles auth automatically):

```typescript
export const Query: QueryResolvers = {
  async adminStats(parent, args, context) {
    // Authentication/authorization handled by directive
    return {
      totalArticles: await Article.countDocuments(),
      totalUsers: await User.countDocuments(),
    };
  },
};
```

### Adding a New Mutation

1. **Define Input and Mutation**:

```graphql
input UpdateArticleViewsInput {
  articleId: ID!
  increment: Int = 1
}

extend type Mutation {
  updateArticleViews(input: UpdateArticleViewsInput!): Article
}
```

2. **Implement Resolver**:

```typescript
export const Mutation: MutationResolvers = {
  async updateArticleViews(parent, { input }, context) {
    const article = await Article.findByIdAndUpdate(
      input.articleId,
      { $inc: { views: input.increment } },
      { new: true }
    );

    if (!article) {
      throw new GraphQLError('Article not found');
    }

    return article;
  },
};
```

## 🧪 Testing Your Changes

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test resolvers/Query.test.ts

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Writing Tests

```typescript
// tests/resolvers/YourFeature.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { YourResolver } from '../../src/graphql/resolvers/YourFeature';

describe('YourFeature Resolver', () => {
  beforeEach(async () => {
    // Clean up test data
  });

  it('should handle your use case', async () => {
    // Arrange
    const context = createTestContext();

    // Act
    const result = await YourResolver.yourMethod(null, args, context, {} as any);

    // Assert
    expect(result).toBeDefined();
  });
});
```

## 🚨 Troubleshooting

### Common Issues

**1. GraphQL Playground Not Loading**

```bash
# Check environment variable
echo $GRAPHQL_PLAYGROUND  # Should be 'true'

# Restart server
pnpm run dev
```

**2. Authentication Errors**

```bash
# Verify Keycloak configuration
curl https://your-keycloak.com/realms/ssbhakthi/protocol/openid-connect/certs

# Check JWT token format
node -e "console.log(JSON.parse(Buffer.from('YOUR_TOKEN_PAYLOAD'.split('.')[1], 'base64').toString()))"
```

**3. Database Connection Issues**

```bash
# Check Docker containers
docker ps

# Restart databases
pnpm run docker:down
pnpm run docker:dev
```

**4. Type Generation Issues**

```bash
# Clean and regenerate
rm -rf src/graphql/__generated__
pnpm run codegen
```

### Getting Help

1. **Check Documentation**: Start with the relevant guide in `docs/`
2. **Review Tests**: Look at existing test files for examples
3. **Use GraphQL Playground**: Test queries interactively
4. **Check Logs**: Development server provides detailed error information

## 📖 Documentation Reference

| Topic                       | Document                                                   |
| --------------------------- | ---------------------------------------------------------- |
| **Complete Implementation** | [`GRAPHQL_IMPLEMENTATION.md`](./GRAPHQL_IMPLEMENTATION.md) |
| **Schema Design**           | [`GRAPHQL_SCHEMA_DESIGN.md`](./GRAPHQL_SCHEMA_DESIGN.md)   |
| **Authentication**          | [`GRAPHQL_AUTH_GUIDE.md`](./GRAPHQL_AUTH_GUIDE.md)         |
| **Performance**             | [`GRAPHQL_PERFORMANCE.md`](./GRAPHQL_PERFORMANCE.md)       |
| **Testing**                 | [`GRAPHQL_TESTING.md`](./GRAPHQL_TESTING.md)               |
| **Project Setup**           | [`PROJECT_SCAFFOLDING.md`](./PROJECT_SCAFFOLDING.md)       |

## 🎯 Next Steps

After completing this onboarding:

1. **Pick a Starter Task**: Choose a small feature to implement
2. **Code Review Process**: Submit your first PR for review
3. **Join Team Discussions**: Participate in architecture decisions
4. **Contribute to Documentation**: Help improve these guides

## ✅ Onboarding Checklist

- [ ] Environment set up and running
- [ ] Can access GraphQL Playground
- [ ] Tests pass successfully
- [ ] Can create and test a simple query
- [ ] Understanding of authentication flow
- [ ] First code change implemented and tested
- [ ] Read all documentation guides
- [ ] Familiar with development workflow

Welcome to the team! 🎉

For questions or support, reach out to the development team or create an issue in the repository.
