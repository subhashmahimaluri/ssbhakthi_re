# GraphQL Testing Best Practices

## Overview

Comprehensive testing guide for the SSBhakthi API GraphQL implementation covering unit testing, integration testing, authentication testing, and performance testing.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Authentication Testing](#authentication-testing)
6. [Performance Testing](#performance-testing)
7. [Test Utilities](#test-utilities)

## Testing Strategy

### Test Pyramid

```
        E2E Tests
       /         \
  Integration     Schema
    Tests         Tests
   /             \
Unit Tests    Performance
(Resolvers)      Tests
```

### Test Types

- **Unit Tests**: Individual resolvers and business logic
- **Integration Tests**: Full GraphQL endpoint with database
- **Authentication Tests**: JWT validation and RBAC
- **Performance Tests**: Query optimization and load testing

## Test Environment Setup

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', 'src/graphql/__generated__/'],
    },
  },
});
```

### Test Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
```

## Unit Testing

### Query Resolver Tests

```typescript
// tests/resolvers/Query.test.ts
describe('Query Resolvers', () => {
  beforeEach(async () => {
    await Article.deleteMany({});
  });

  it('should return paginated articles', async () => {
    // Arrange
    await Article.create([
      createMockArticle({ title: { en: 'Article 1' } }),
      createMockArticle({ title: { en: 'Article 2' } }),
    ]);

    const context = createTestContext();

    // Act
    const result = await Query.articles(null, { limit: 2 }, context, {} as any);

    // Assert
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter articles by status', async () => {
    await Article.create([
      createMockArticle({ status: 'PUBLISHED' }),
      createMockArticle({ status: 'DRAFT' }),
    ]);

    const result = await Query.articles(
      null,
      { filters: { status: 'PUBLISHED' } },
      createTestContext(),
      {} as any
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('PUBLISHED');
  });
});
```

### Mutation Resolver Tests

```typescript
// tests/resolvers/Mutation.test.ts
describe('Mutation Resolvers', () => {
  it('should create article with valid auth', async () => {
    const user = createMockUser({ roles: ['author'] });
    const context = createTestContext(user);
    const input = createMockArticleInput();

    const result = await Mutation.createArticle(null, { input }, context, {} as any);

    expect(result.title.en).toBe(input.title.en);
    expect(result.audit.createdBy).toBe(user.sub);
  });

  it('should throw error without authentication', async () => {
    const context = createTestContext(); // No user
    const input = createMockArticleInput();

    await expect(Mutation.createArticle(null, { input }, context, {} as any)).rejects.toThrow(
      'Authentication required'
    );
  });
});
```

### Field Resolver Tests

```typescript
// tests/resolvers/Article.test.ts
describe('Article Field Resolvers', () => {
  it('should resolve categories using DataLoader', async () => {
    const categories = await Category.create([createMockCategory({ name: { en: 'Tech' } })]);

    const article = createMockArticle({ categories: [categories[0].id] });
    const context = createTestContext();

    const result = await ArticleResolvers.categories(article, {}, context, {} as any);

    expect(result).toHaveLength(1);
    expect(result[0].name.en).toBe('Tech');
  });
});
```

## Integration Testing

### Full GraphQL Tests

```typescript
// tests/integration/graphql.test.ts
describe('GraphQL Integration', () => {
  it('should execute articles query with relationships', async () => {
    const category = await Category.create(createMockCategory());
    await Article.create([createMockArticle({ categories: [category.id] })]);

    const query = `
      query {
        articles {
          items {
            id
            title { en }
            categories { id name { en } }
          }
        }
      }
    `;

    const response = await request(testApp).post('/graphql').send({ query }).expect(200);

    expect(response.body.data.articles.items).toHaveLength(1);
    expect(response.body.data.articles.items[0].categories).toHaveLength(1);
  });

  it('should create article with authentication', async () => {
    const mutation = `
      mutation CreateArticle($input: ArticleInput!) {
        createArticle(input: $input) {
          id
          title { en }
        }
      }
    `;

    const input = {
      type: 'blog',
      title: { en: 'Test Article' },
      slug: { en: 'test-article' },
      locales: ['en'],
    };

    const response = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.author}`)
      .send({ query: mutation, variables: { input } })
      .expect(200);

    expect(response.body.data.createArticle.title.en).toBe('Test Article');
  });
});
```

## Authentication Testing

### JWT Authentication Tests

```typescript
// tests/auth/auth.test.ts
describe('GraphQL Authentication', () => {
  it('should require auth for protected fields', async () => {
    const query = `{ me { id email } }`;

    const response = await request(testApp).post('/graphql').send({ query }).expect(200);

    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('should allow authenticated requests', async () => {
    const query = `{ me { id email } }`;

    const response = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.user}`)
      .send({ query })
      .expect(200);

    expect(response.body.data.me).toBeDefined();
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

    // User without author role
    const userResponse = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.user}`)
      .send({ query: mutation })
      .expect(200);

    expect(userResponse.body.errors[0].extensions.code).toBe('FORBIDDEN');

    // Author should succeed
    const authorResponse = await request(testApp)
      .post('/graphql')
      .set('Authorization', `Bearer ${mockTokens.author}`)
      .send({ query: mutation })
      .expect(200);

    expect(authorResponse.body.data.createArticle).toBeDefined();
  });
});
```

## Performance Testing

### Query Performance Tests

```typescript
// tests/performance/performance.test.ts
describe('GraphQL Performance', () => {
  beforeEach(async () => {
    // Create test data: 50 articles with relationships
    const categories = await Category.create(Array.from({ length: 5 }, createMockCategory));
    const tags = await Tag.create(Array.from({ length: 10 }, createMockTag));

    await Article.create(
      Array.from({ length: 50 }, () =>
        createMockArticle({
          categories: [categories[Math.floor(Math.random() * 5)].id],
          tags: tags.slice(0, 3).map(t => t.id),
        })
      )
    );
  });

  it('should execute complex query within time limit', async () => {
    const complexQuery = `
      query {
        articles(limit: 20) {
          items {
            id
            title { en }
            categories { id name { en } }
            tags { id name }
          }
        }
      }
    `;

    const startTime = process.hrtime.bigint();

    const response = await request(testApp)
      .post('/graphql')
      .send({ query: complexQuery })
      .expect(200);

    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;

    expect(response.body.data.articles.items).toHaveLength(20);
    expect(duration).toBeLessThan(1000); // Under 1 second
  });

  it('should handle concurrent requests', async () => {
    const query = `{ articles(limit: 5) { items { id title { en } } } }`;

    const promises = Array.from({ length: 10 }, () =>
      request(testApp).post('/graphql').send({ query })
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.data.articles.items).toHaveLength(5);
    });
  });
});
```

## Test Utilities

### Mock Data Factory

```typescript
// tests/utils/mockData.ts
export function createMockUser(overrides = {}) {
  return {
    sub: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    ...overrides,
  };
}

export function createMockArticle(overrides = {}) {
  return {
    type: 'blog',
    title: { en: 'Test Article', te: 'పరీక్ష వ్యాసం' },
    slug: { en: 'test-article', te: 'పరీక్ష-వ్యాసం' },
    summary: { en: 'Test summary' },
    bodyHtml: { en: '<p>Test content</p>' },
    categories: [],
    tags: [],
    locales: ['en'],
    status: 'PUBLISHED',
    audit: {
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  };
}

export function createMockCategory(overrides = {}) {
  return {
    name: { en: 'Test Category', te: 'పరీక్ష వర్గం' },
    slug: { en: 'test-category', te: 'పరీక్ష-వర్గం' },
    isActive: true,
    order: 0,
    createdBy: 'test-user',
    ...overrides,
  };
}
```

### Mock Authentication

```typescript
// tests/utils/mockAuth.ts
import jwt from 'jsonwebtoken';

export function createMockJWT(payload = {}) {
  const defaultPayload = {
    sub: 'test-user-123',
    email: 'test@example.com',
    realm_access: { roles: ['user'] },
    iss: process.env.KEYCLOAK_ISSUER,
    aud: process.env.KEYCLOAK_AUDIENCE,
    exp: Math.floor(Date.now() / 1000) + 3600,
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

### Test Context Factory

```typescript
// tests/utils/testContext.ts
import { createLoaders } from '../../src/graphql/resolvers/loaders';

export function createTestContext(user = null) {
  return {
    user,
    loaders: createLoaders(),
    req: { user },
  };
}
```

## Running Tests

### Test Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test graphql.test.ts

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run integration tests only
pnpm test tests/integration

# Run performance tests
pnpm test tests/performance
```

### Test Debugging

```bash
# Debug specific test
pnpm test --reporter=verbose graphql.test.ts

# Run with Node inspector
node --inspect-brk node_modules/.bin/vitest run

# Environment variables for testing
NODE_ENV=test DEBUG=test:* pnpm test
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up test data in beforeEach/afterEach

### 2. Mock Strategy

- Mock external services (Keycloak, file systems)
- Use real database for integration tests
- Create reusable mock factories
- Test both success and error paths

### 3. Performance Testing

- Test with realistic data volumes
- Monitor query execution times
- Test concurrent request handling
- Validate DataLoader effectiveness

### 4. Authentication Testing

- Test all authentication scenarios
- Verify role-based access control
- Test token expiration handling
- Validate error responses

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [GraphQL Testing Best Practices](https://www.apollographql.com/docs/apollo-server/testing/testing/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
