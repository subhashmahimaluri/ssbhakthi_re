# GraphQL Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for the SSBhakthi API GraphQL implementation. It includes DataLoader patterns, query optimization, caching strategies, and monitoring techniques to ensure optimal performance at scale.

## Table of Contents

1. [Performance Architecture](#performance-architecture)
2. [DataLoader Implementation](#dataloader-implementation)
3. [Query Optimization](#query-optimization)
4. [Database Performance](#database-performance)
5. [Caching Strategies](#caching-strategies)
6. [Monitoring and Metrics](#monitoring-and-metrics)
7. [Load Testing](#load-testing)
8. [Optimization Checklist](#optimization-checklist)
9. [Troubleshooting Performance](#troubleshooting-performance)

## Performance Architecture

### GraphQL Performance Challenges

1. **N+1 Query Problem**: Nested resolvers causing multiple database calls
2. **Over-fetching**: Retrieving unnecessary data
3. **Under-fetching**: Multiple round trips for related data
4. **Complex Query Validation**: Expensive schema validation
5. **Memory Usage**: Large result sets and object creation

### Solution Strategy

```
Client Request
      │
      ▼
Query Validation & Complexity Analysis
      │
      ▼
DataLoader Batching
      │
      ▼
Database Query Optimization
      │
      ▼
Redis Caching Layer
      │
      ▼
Response Compression
      │
      ▼
Client Response
```

## DataLoader Implementation

### Core DataLoader Pattern

```typescript
// src/graphql/resolvers/loaders.ts

import DataLoader from 'dataloader';
import { Article, Category, Tag, MediaAsset, User } from '../../models';

export interface Loaders {
  categoriesById: DataLoader<string, Category | null>;
  tagsById: DataLoader<string, Tag | null>;
  mediaAssetsById: DataLoader<string, MediaAsset | null>;
  usersById: DataLoader<string, User | null>;
  articlesByCategory: DataLoader<string, Article[]>;
  articlesByTag: DataLoader<string, Article[]>;
  categoryChildren: DataLoader<string, Category[]>;
}

/**
 * Create all DataLoader instances for a request
 */
export function createLoaders(): Loaders {
  return {
    categoriesById: createCategoriesByIdLoader(),
    tagsById: createTagsByIdLoader(),
    mediaAssetsById: createMediaAssetsByIdLoader(),
    usersById: createUsersByIdLoader(),
    articlesByCategory: createArticlesByCategoryLoader(),
    articlesByTag: createArticlesByTagLoader(),
    categoryChildren: createCategoryChildrenLoader(),
  };
}
```

### Categories by ID Loader

```typescript
/**
 * Efficiently load categories by ID to avoid N+1 queries
 */
function createCategoriesByIdLoader(): DataLoader<string, Category | null> {
  return new DataLoader(
    async (ids: readonly string[]) => {
      console.log(`Loading ${ids.length} categories:`, ids);

      // Single database query for all requested categories
      const categories = await Category.find({
        _id: { $in: ids },
        isActive: true,
      });

      // Create a map for O(1) lookup
      const categoryMap = new Map(categories.map(category => [category.id, category]));

      // Return results in the same order as requested IDs
      return ids.map(id => categoryMap.get(id) || null);
    },
    {
      // Cache results for the duration of the request
      cache: true,
      // Batch multiple calls within 10ms
      batchScheduleFn: callback => setTimeout(callback, 10),
      // Maximum batch size
      maxBatchSize: 100,
      // Cache key function
      cacheKeyFn: (key: string) => key,
    }
  );
}
```

### Tags by ID Loader

```typescript
function createTagsByIdLoader(): DataLoader<string, Tag | null> {
  return new DataLoader(async (ids: readonly string[]) => {
    console.log(`Loading ${ids.length} tags:`, ids);

    const tags = await Tag.find({
      _id: { $in: ids },
      isActive: true,
    });

    const tagMap = new Map(tags.map(tag => [tag.id, tag]));
    return ids.map(id => tagMap.get(id) || null);
  });
}
```

### Articles by Category Loader

```typescript
function createArticlesByCategoryLoader(): DataLoader<string, Article[]> {
  return new DataLoader(async (categoryIds: readonly string[]) => {
    console.log(`Loading articles for ${categoryIds.length} categories`);

    // Find all articles that belong to any of the requested categories
    const articles = await Article.find({
      categories: { $in: categoryIds },
      status: 'PUBLISHED',
      isActive: true,
    }).sort({ 'audit.updatedAt': -1 });

    // Group articles by category
    const articlesByCategory = new Map<string, Article[]>();

    // Initialize empty arrays for all requested categories
    categoryIds.forEach(categoryId => {
      articlesByCategory.set(categoryId, []);
    });

    // Group articles by their categories
    articles.forEach(article => {
      article.categories.forEach(categoryId => {
        if (categoryIds.includes(categoryId)) {
          const categoryArticles = articlesByCategory.get(categoryId) || [];
          categoryArticles.push(article);
          articlesByCategory.set(categoryId, categoryArticles);
        }
      });
    });

    // Return articles in the same order as requested category IDs
    return categoryIds.map(categoryId => articlesByCategory.get(categoryId) || []);
  });
}
```

### Usage in Resolvers

```typescript
// src/graphql/resolvers/Article.ts

export const Article: ArticleResolvers = {
  /**
   * Efficiently resolve categories using DataLoader
   */
  async categories(parent, args, context) {
    if (!parent.categories || parent.categories.length === 0) {
      return [];
    }

    // Use DataLoader to batch category requests
    const categories = await Promise.all(
      parent.categories.map(categoryId => context.loaders.categoriesById.load(categoryId))
    );

    // Filter out null results (deleted categories)
    return categories.filter((category): category is Category => category !== null);
  },

  /**
   * Efficiently resolve tags using DataLoader
   */
  async tags(parent, args, context) {
    if (!parent.tags || parent.tags.length === 0) {
      return [];
    }

    const tags = await Promise.all(parent.tags.map(tagId => context.loaders.tagsById.load(tagId)));

    return tags.filter((tag): tag is Tag => tag !== null);
  },

  /**
   * Efficiently resolve cover image using DataLoader
   */
  async cover(parent, args, context) {
    if (!parent.cover) {
      return null;
    }

    return await context.loaders.mediaAssetsById.load(parent.cover);
  },
};
```

## Query Optimization

### Database Query Patterns

```typescript
// Optimized query builders
export class ArticleQueryBuilder {
  private query: any = {};
  private sortOptions: any = { 'audit.updatedAt': -1 };
  private populateOptions: string[] = [];

  filterByStatus(status: ArticleStatus) {
    this.query.status = status;
    return this;
  }

  filterByType(type: string) {
    this.query.type = type;
    return this;
  }

  filterByLocale(locale: string) {
    this.query.locales = locale;
    return this;
  }

  filterByCategory(categoryId: string) {
    this.query.categories = categoryId;
    return this;
  }

  filterByTag(tagId: string) {
    this.query.tags = tagId;
    return this;
  }

  search(searchTerm: string) {
    this.query.$text = { $search: searchTerm };
    return this;
  }

  dateRange(after?: Date, before?: Date) {
    if (after || before) {
      this.query['audit.createdAt'] = {};
      if (after) this.query['audit.createdAt'].$gte = after;
      if (before) this.query['audit.createdAt'].$lte = before;
    }
    return this;
  }

  sort(sortString: string) {
    // Parse sort string like "-audit.updatedAt,title.en"
    const sortOptions: any = {};
    sortString.split(',').forEach(field => {
      if (field.startsWith('-')) {
        sortOptions[field.substring(1)] = -1;
      } else {
        sortOptions[field] = 1;
      }
    });
    this.sortOptions = sortOptions;
    return this;
  }

  async execute(limit: number = 20, offset: number = 0) {
    const [items, total] = await Promise.all([
      Article.find(this.query).sort(this.sortOptions).limit(limit).skip(offset).lean(), // Use lean() for better performance when we don't need Mongoose docs
      Article.countDocuments(this.query),
    ]);

    return {
      items,
      total,
      hasNextPage: offset + limit < total,
      hasPreviousPage: offset > 0,
    };
  }
}
```

### Efficient Resolver Implementation

```typescript
// src/graphql/resolvers/Query.ts

export const Query: QueryResolvers = {
  async articles(parent, args, context) {
    const { filters = {}, limit = 20, offset = 0, sort = '-audit.updatedAt' } = args;

    // Build optimized query
    const builder = new ArticleQueryBuilder();

    if (filters.status) builder.filterByStatus(filters.status);
    if (filters.type) builder.filterByType(filters.type);
    if (filters.locale) builder.filterByLocale(filters.locale);
    if (filters.category) builder.filterByCategory(filters.category);
    if (filters.tag) builder.filterByTag(filters.tag);
    if (filters.search) builder.search(filters.search);
    if (filters.createdAfter || filters.createdBefore) {
      builder.dateRange(filters.createdAfter, filters.createdBefore);
    }

    builder.sort(sort);

    // Execute optimized query
    return await builder.execute(limit, offset);
  },

  async article(parent, { id }, context) {
    // Single optimized query with necessary fields only
    const article = await Article.findById(id)
      .select(
        'id type title slug summary bodyHtml cover categories tags locales status revision audit'
      )
      .lean();

    if (!article) {
      throw new GraphQLError('Article not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    return article;
  },
};
```

## Database Performance

### MongoDB Indexes

```typescript
// Optimized indexes for Article model
ArticleSchema.index({ status: 1, 'audit.updatedAt': -1 }); // List queries
ArticleSchema.index({ type: 1, status: 1 }); // Type filtering
ArticleSchema.index({ categories: 1 }); // Category filtering
ArticleSchema.index({ tags: 1 }); // Tag filtering
ArticleSchema.index({ locales: 1 }); // Locale filtering
ArticleSchema.index({ 'slug.en': 1 }, { unique: true, sparse: true }); // English slugs
ArticleSchema.index({ 'slug.te': 1 }, { unique: true, sparse: true }); // Telugu slugs
ArticleSchema.index({ 'audit.createdBy': 1, status: 1 }); // User's articles
ArticleSchema.index({ 'audit.createdAt': -1 }); // Date sorting

// Text search index for full-text search
ArticleSchema.index(
  {
    'title.en': 'text',
    'title.te': 'text',
    'summary.en': 'text',
    'summary.te': 'text',
  },
  {
    name: 'article_text_search',
    weights: {
      'title.en': 10,
      'title.te': 10,
      'summary.en': 5,
      'summary.te': 5,
    },
  }
);

// Compound indexes for common query patterns
ArticleSchema.index({ type: 1, status: 1, 'audit.updatedAt': -1 });
ArticleSchema.index({ categories: 1, status: 1, 'audit.updatedAt': -1 });
```

### Query Performance Monitoring

```typescript
// Database query monitoring
import mongoose from 'mongoose';

if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collection, method, query, doc) => {
    console.log(`${collection}.${method}`, JSON.stringify(query), doc);
  });
}

// Slow query monitoring
const slowQueryThreshold = 100; // ms

mongoose.connection.on('connected', () => {
  const db = mongoose.connection.db;
  if (db) {
    db.command({ profile: 2, slowms: slowQueryThreshold });
  }
});
```

### Connection Pooling

```typescript
// Optimized MongoDB connection
import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URL!, {
      // Connection pool settings
      maxPoolSize: 10, // Maximum connections
      minPoolSize: 5, // Minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30s idle
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // Close sockets after 45s inactivity

      // Performance optimizations
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    });

    console.log('📦 MongoDB connected:', mongoose.connection.host);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}
```

## Caching Strategies

### Redis Integration

```typescript
// src/config/redis.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

export { redis };

// Cache utility functions
export class CacheManager {
  private static readonly DEFAULT_TTL = 300; // 5 minutes

  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}
```

### Query Result Caching

```typescript
// Cached resolver wrapper
export function withCache<T>(key: (args: any) => string, ttl: number = 300) {
  return function (resolver: Function) {
    return async function (parent: any, args: any, context: any, info: any) {
      const cacheKey = key(args);

      // Try to get from cache first
      const cached = await CacheManager.get<T>(cacheKey);
      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute resolver
      const result = await resolver(parent, args, context, info);

      // Cache the result
      await CacheManager.set(cacheKey, result, ttl);
      console.log(`Cache set: ${cacheKey}`);

      return result;
    };
  };
}

// Usage in resolvers
export const Query: QueryResolvers = {
  articles: withCache(
    args => `articles:${JSON.stringify(args)}`,
    300 // 5 minutes
  )(async (parent, args, context) => {
    return await getArticles(args);
  }),

  article: withCache(
    args => `article:${args.id}`,
    600 // 10 minutes
  )(async (parent, { id }, context) => {
    return await Article.findById(id);
  }),
};
```

### Cache Invalidation

```typescript
// Smart cache invalidation
export const Mutation: MutationResolvers = {
  async createArticle(parent, { input }, context) {
    const article = await Article.create({
      ...input,
      audit: {
        createdBy: context.user.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Invalidate relevant caches
    await Promise.all([
      CacheManager.invalidatePattern('articles:*'),
      CacheManager.invalidatePattern(`category:${input.categories?.join('|')}:*`),
      CacheManager.invalidatePattern(`tag:${input.tags?.join('|')}:*`),
    ]);

    return article;
  },

  async updateArticle(parent, { id, input }, context) {
    const article = await Article.findByIdAndUpdate(
      id,
      {
        ...input,
        'audit.updatedBy': context.user.sub,
        'audit.updatedAt': new Date(),
      },
      { new: true }
    );

    // Invalidate specific article and list caches
    await Promise.all([
      CacheManager.del(`article:${id}`),
      CacheManager.invalidatePattern('articles:*'),
    ]);

    return article;
  },
};
```

## Monitoring and Metrics

### Performance Metrics Collection

```typescript
// Performance monitoring middleware
export function performanceMiddleware() {
  return {
    requestDidStart() {
      const startTime = process.hrtime.bigint();

      return {
        didResolveField({ info }) {
          const fieldStartTime = process.hrtime.bigint();

          return () => {
            const fieldEndTime = process.hrtime.bigint();
            const duration = Number(fieldEndTime - fieldStartTime) / 1000000; // Convert to ms

            // Log slow fields
            if (duration > 100) {
              console.warn(
                `Slow field resolver: ${info.parentType.name}.${info.fieldName} took ${duration.toFixed(2)}ms`
              );
            }

            // Collect metrics
            collectFieldMetrics(info.parentType.name, info.fieldName, duration);
          };
        },

        willSendResponse({ response }) {
          const endTime = process.hrtime.bigint();
          const totalDuration = Number(endTime - startTime) / 1000000;

          // Log slow queries
          if (totalDuration > 1000) {
            console.warn(`Slow GraphQL query took ${totalDuration.toFixed(2)}ms`);
          }

          // Add performance headers
          response.http.headers.set('X-Response-Time', `${totalDuration.toFixed(2)}ms`);

          collectQueryMetrics(totalDuration);
        },
      };
    },
  };
}
```

### Health Check Metrics

```typescript
// GraphQL-specific health metrics
export async function getGraphQLHealth() {
  const metrics = {
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      collections: await mongoose.connection.db.stats(),
    },
    cache: {
      connected: redis.status === 'ready',
      memory: await redis.memory('usage'),
    },
    performance: {
      averageQueryTime: getAverageQueryTime(),
      slowQueries: getSlowQueriesCount(),
      cacheHitRate: getCacheHitRate(),
    },
  };

  return metrics;
}
```

### DataLoader Statistics

```typescript
// Enhanced DataLoader with metrics
function createCategoriesByIdLoader(): DataLoader<string, Category | null> {
  let totalLoads = 0;
  let totalBatches = 0;

  return new DataLoader(
    async (ids: readonly string[]) => {
      totalBatches++;
      totalLoads += ids.length;

      console.log(
        `DataLoader batch: ${ids.length} categories (total: ${totalLoads} in ${totalBatches} batches)`
      );

      const categories = await Category.find({ _id: { $in: ids } });
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      return ids.map(id => categoryMap.get(id) || null);
    },
    {
      cache: true,
      batchScheduleFn: callback => setTimeout(callback, 10),
    }
  );
}
```

## Load Testing

### GraphQL Load Testing

```javascript
// load-test.js - K6 load testing script

import http from 'k6/http';
import { check, group } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Steady state
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  group('GraphQL Queries', function () {
    // Test simple query
    const pingQuery = {
      query: '{ ping }',
    };

    let response = http.post(`${BASE_URL}/graphql`, JSON.stringify(pingQuery), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'ping query status is 200': r => r.status === 200,
      'ping returns pong': r => JSON.parse(r.body).data.ping === 'pong',
    });

    // Test complex query
    const articlesQuery = {
      query: `
        {
          articles(limit: 10) {
            items {
              id
              title { en te }
              categories {
                id
                name { en te }
              }
              tags {
                id
                name
              }
            }
            total
          }
        }
      `,
    };

    response = http.post(`${BASE_URL}/graphql`, JSON.stringify(articlesQuery), {
      headers: { 'Content-Type': 'application/json' },
    });

    check(response, {
      'articles query status is 200': r => r.status === 200,
      'articles response time < 500ms': r => r.timings.duration < 500,
    });
  });
}
```

### Performance Benchmarks

```bash
# Run load tests
k6 run load-test.js

# Memory profiling
node --inspect --max-old-space-size=4096 dist/server.js

# CPU profiling
node --prof dist/server.js

# Analyze profiles
node --prof-process isolate-*.log > profile.txt
```

## Optimization Checklist

### Development Phase

- [ ] **DataLoader Implementation**
  - [ ] Categories by ID loader
  - [ ] Tags by ID loader
  - [ ] Media assets by ID loader
  - [ ] Users by ID loader
  - [ ] Relationship loaders (articles by category/tag)

- [ ] **Database Optimization**
  - [ ] Proper indexes for all query patterns
  - [ ] Compound indexes for complex queries
  - [ ] Text search indexes
  - [ ] Query performance monitoring

- [ ] **Resolver Optimization**
  - [ ] Field-level optimization
  - [ ] Efficient query builders
  - [ ] Lean queries where appropriate
  - [ ] Pagination implementation

### Staging Phase

- [ ] **Caching Strategy**
  - [ ] Redis integration
  - [ ] Query result caching
  - [ ] Smart cache invalidation
  - [ ] Cache hit rate monitoring

- [ ] **Security & Limits**
  - [ ] Query depth limiting
  - [ ] Query complexity analysis
  - [ ] Rate limiting
  - [ ] Input validation

- [ ] **Monitoring Setup**
  - [ ] Performance metrics collection
  - [ ] Slow query logging
  - [ ] Error tracking
  - [ ] Health checks

### Production Phase

- [ ] **Performance Monitoring**
  - [ ] Response time tracking
  - [ ] DataLoader effectiveness
  - [ ] Cache performance
  - [ ] Database query analysis

- [ ] **Scaling Preparation**
  - [ ] Connection pooling
  - [ ] Horizontal scaling readiness
  - [ ] Load balancer configuration
  - [ ] CDN for static assets

## Troubleshooting Performance

### Common Performance Issues

1. **N+1 Query Problem**

   ```typescript
   // ❌ Bad: Causes N+1 queries
   const articles = await Article.find();
   for (const article of articles) {
     article.categories = await Category.find({ _id: { $in: article.categories } });
   }

   // ✅ Good: Use DataLoader
   const articles = await Article.find();
   for (const article of articles) {
     article.categories = await Promise.all(
       article.categories.map(id => context.loaders.categoriesById.load(id))
     );
   }
   ```

2. **Over-fetching Data**

   ```typescript
   // ❌ Bad: Fetches all fields
   const article = await Article.findById(id);

   // ✅ Good: Select only needed fields
   const article = await Article.findById(id).select('id title summary status audit');
   ```

3. **Memory Leaks**

   ```typescript
   // ❌ Bad: DataLoader persists across requests
   const globalLoader = new DataLoader(/* ... */);

   // ✅ Good: Create per-request loaders
   function createContext() {
     return {
       loaders: createLoaders(), // Fresh loaders per request
     };
   }
   ```

### Performance Debugging

```typescript
// Debug DataLoader effectiveness
const loader = new DataLoader(batchFunction, {
  cache: true,
  batchScheduleFn: callback => {
    console.log('Batching scheduled');
    setTimeout(callback, 10);
  },
});

// Monitor cache hits/misses
const originalLoad = loader.load.bind(loader);
loader.load = key => {
  console.log(`Loading key: ${key}`);
  return originalLoad(key);
};
```

### Query Analysis

```bash
# MongoDB query profiling
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);

# GraphQL query complexity analysis
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    types {
      ...FullType
    }
  }
}
```

## Resources

- [DataLoader GitHub](https://github.com/graphql/dataloader)
- [GraphQL Performance Tips](https://www.apollographql.com/blog/apollo-federation/apollo-studio/performance-in-apollo-studio/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/analyzing-mongodb-performance/)
- [Redis Performance Optimization](https://redis.io/docs/manual/performance/)
- [K6 Load Testing](https://k6.io/docs/)
