# GraphQL Schema Design Guide

## Overview

This guide provides comprehensive details on the GraphQL schema design principles, patterns, and conventions used in the SSBhakthi API. It serves as a reference for developers working with the GraphQL schema.

## Table of Contents

1. [Schema Design Principles](#schema-design-principles)
2. [Type System](#type-system)
3. [Naming Conventions](#naming-conventions)
4. [Directive Usage](#directive-usage)
5. [Input Types and Validation](#input-types-and-validation)
6. [Pagination Patterns](#pagination-patterns)
7. [Error Handling](#error-handling)
8. [Localization Support](#localization-support)
9. [Schema Evolution](#schema-evolution)
10. [Best Practices](#best-practices)

## Schema Design Principles

### 1. Schema-First Approach

We follow a **schema-first** development approach where:

- The GraphQL schema defines the API contract
- Schema changes drive implementation changes
- Types are auto-generated from schema
- Documentation is embedded in schema

```graphql
"""
Represents an article in the content management system.
Articles support multiple languages and have an audit trail.
"""
type Article {
  """
  Unique identifier for the article
  """
  id: ID!

  """
  Article type (blog, news, announcement, etc.)
  """
  type: String!

  """
  Multi-language title of the article
  """
  title: LocaleString!

  # ... other fields
}
```

### 2. Business Domain Modeling

The schema models real business entities and operations:

- **Entities**: Article, Category, Tag, MediaAsset, User
- **Value Objects**: LocaleString, AuditInfo, ArticleSchedule
- **Operations**: Create, Update, Publish, Archive
- **Relationships**: Categories, Tags, Media attachments

### 3. Consistency and Predictability

All schema elements follow consistent patterns:

- Uniform naming conventions
- Consistent field types
- Predictable relationship patterns
- Standard pagination approach

## Type System

### Scalar Types

```graphql
"""
ISO 8601 datetime string (e.g., '2024-01-01T00:00:00Z')
"""
scalar DateTime

"""
Arbitrary JSON object for flexible metadata
"""
scalar JSON
```

### Custom Object Types

```graphql
"""
Represents multi-language content with English and Telugu support
"""
type LocaleString {
  """
  English content
  """
  en: String

  """
  Telugu content
  """
  te: String
}

"""
Audit information for tracking entity changes
"""
type AuditInfo {
  """
  User who created the entity
  """
  createdBy: String!

  """
  Timestamp when entity was created
  """
  createdAt: DateTime!

  """
  User who last updated the entity
  """
  updatedBy: String

  """
  Timestamp when entity was last updated
  """
  updatedAt: DateTime!
}
```

### Enumerations

```graphql
"""
Article publication status in the content lifecycle
"""
enum ArticleStatus {
  """
  Draft - work in progress, not visible
  """
  DRAFT

  """
  Review - submitted for editorial review
  """
  REVIEW

  """
  Scheduled - approved for future publication
  """
  SCHEDULED

  """
  Published - live and visible to users
  """
  PUBLISHED

  """
  Archived - no longer active but preserved
  """
  ARCHIVED
}
```

### Interface Types

```graphql
"""
Common interface for auditable entities
"""
interface Auditable {
  """
  Audit trail information
  """
  audit: AuditInfo!

  """
  Whether the entity is active
  """
  isActive: Boolean!
}

"""
Interface for entities that support localization
"""
interface Localizable {
  """
  Available language codes
  """
  locales: [String!]!
}
```

## Naming Conventions

### Field Names

- **camelCase** for all field names
- **Descriptive** and **unambiguous**
- **Avoid abbreviations** unless widely understood

```graphql
# ✅ Good
type Article {
  bodyHtml: LocaleString
  publishedAt: DateTime
  isPublished: Boolean
}

# ❌ Bad
type Article {
  body_html: LocaleString # snake_case
  pub_at: DateTime # abbreviation
  is_pub: Boolean # unclear abbreviation
}
```

### Type Names

- **PascalCase** for all type names
- **Singular nouns** for object types
- **Descriptive** of the business entity

```graphql
# ✅ Good
type Article
type MediaAsset
type UserProfile

# ❌ Bad
type article # lowercase
type Articles # plural
type media_asset # snake_case
```

### Enum Values

- **UPPER_SNAKE_CASE** for enum values
- **Descriptive** of the state or option

```graphql
# ✅ Good
enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# ❌ Bad
enum ArticleStatus {
  draft # lowercase
  Published # mixed case
  ARCH # abbreviation
}
```

### Input Types

- **PascalCase** with **Input** suffix
- **Mirror output types** where appropriate

```graphql
# ✅ Good
input ArticleInput {
  title: LocaleStringInput!
  summary: LocaleStringInput
  bodyHtml: LocaleStringInput
}

input LocaleStringInput {
  en: String
  te: String
}

# ❌ Bad
input articleInput # camelCase
input ArticleData # unclear suffix
input ArticleCreate # inconsistent suffix
```

## Directive Usage

### Authentication Directive

```graphql
"""
Requires user to be authenticated
"""
directive @auth on FIELD_DEFINITION

# Usage
type Query {
  """
  Get current user profile (requires authentication)
  """
  me: User @auth
}
```

### Authorization Directive

```graphql
"""
Requires user to have one of the specified roles
"""
directive @hasRole(
  """
  Required roles (user must have at least one)
  """
  roles: [String!]!
) on FIELD_DEFINITION

# Usage
type Mutation {
  """
  Create new article (requires author, editor, or admin role)
  """
  createArticle(input: ArticleInput!): Article @hasRole(roles: ["author", "editor", "admin"])

  """
  Change article status (requires editor or admin role)
  """
  changeStatus(id: ID!, status: ArticleStatus!): Article @hasRole(roles: ["editor", "admin"])
}
```

### Deprecation Directive

```graphql
type Article {
  """
  @deprecated Use 'audit.createdAt' instead
  """
  createdAt: DateTime @deprecated(reason: "Use 'audit.createdAt' instead")

  """
  Audit information including creation and update timestamps
  """
  audit: AuditInfo!
}
```

## Input Types and Validation

### Input Type Design

```graphql
"""
Input for creating or updating articles
"""
input ArticleInput {
  """
  Article type (required for creation)
  """
  type: String!

  """
  Multi-language title (required)
  """
  title: LocaleStringInput!

  """
  URL-friendly slug (required)
  """
  slug: LocaleStringInput!

  """
  Short summary or excerpt
  """
  summary: LocaleStringInput

  """
  Full HTML content
  """
  bodyHtml: LocaleStringInput

  """
  Category IDs to associate with article
  """
  categories: [ID!]

  """
  Tag IDs to associate with article
  """
  tags: [ID!]

  """
  Supported language codes
  """
  locales: [String!]!

  """
  Publication status
  """
  status: ArticleStatus

  """
  Scheduling information
  """
  schedule: ArticleScheduleInput

  """
  SEO metadata
  """
  seo: JSON
}

"""
Input for multi-language content
"""
input LocaleStringInput {
  """
  English content
  """
  en: String

  """
  Telugu content
  """
  te: String
}

"""
Input for article scheduling
"""
input ArticleScheduleInput {
  """
  When to publish the article
  """
  publishAt: DateTime

  """
  When to unpublish the article
  """
  unpublishAt: DateTime
}
```

### Validation Patterns

```graphql
"""
Filters for querying articles
"""
input ArticleFilters {
  """
  Filter by article type
  """
  type: String

  """
  Filter by publication status
  """
  status: ArticleStatus

  """
  Filter by language code
  """
  locale: String

  """
  Filter by tag name
  """
  tag: String

  """
  Filter by category ID
  """
  category: ID

  """
  Full-text search query
  """
  search: String

  """
  Filter by creation date range
  """
  createdAfter: DateTime
  createdBefore: DateTime
}
```

## Pagination Patterns

### Offset-based Pagination

```graphql
"""
Paginated result for articles
"""
type ArticlesResult {
  """
  Array of articles for current page
  """
  items: [Article!]!

  """
  Total number of articles matching filters
  """
  total: Int!

  """
  Whether there are more pages after current
  """
  hasNextPage: Boolean!

  """
  Whether there are pages before current
  """
  hasPreviousPage: Boolean!
}

type Query {
  """
  Get paginated list of articles
  """
  articles(
    """
    Filter criteria
    """
    filters: ArticleFilters

    """
    Number of items per page (max 100)
    """
    limit: Int = 20

    """
    Number of items to skip
    """
    offset: Int = 0

    """
    Sort order (e.g., '-audit.updatedAt', 'title.en')
    """
    sort: String = "-audit.updatedAt"
  ): ArticlesResult!
}
```

### Cursor-based Pagination (Future)

```graphql
"""
Connection-based pagination for articles
"""
type ArticleConnection {
  """
  Article edges with cursors
  """
  edges: [ArticleEdge!]!

  """
  Page information
  """
  pageInfo: PageInfo!

  """
  Total count (expensive, use sparingly)
  """
  totalCount: Int
}

type ArticleEdge {
  """
  Article node
  """
  node: Article!

  """
  Cursor for this edge
  """
  cursor: String!
}

type PageInfo {
  """
  Whether there are more pages
  """
  hasNextPage: Boolean!

  """
  Whether there are previous pages
  """
  hasPreviousPage: Boolean!

  """
  Cursor of first item
  """
  startCursor: String

  """
  Cursor of last item
  """
  endCursor: String
}
```

## Error Handling

### Error Types

```graphql
"""
Standard error interface
"""
interface Error {
  """
  Error message for developers
  """
  message: String!

  """
  Error code for programmatic handling
  """
  code: String!

  """
  Path to the field that caused the error
  """
  path: [String!]
}

"""
Validation error for input validation failures
"""
type ValidationError implements Error {
  message: String!
  code: String!
  path: [String!]

  """
  Field that failed validation
  """
  field: String!

  """
  Validation rule that was violated
  """
  rule: String!
}

"""
Authentication error for unauthorized access
"""
type AuthenticationError implements Error {
  message: String!
  code: String!
  path: [String!]

  """
  Required authentication level
  """
  requiredAuth: String!
}
```

### Error Response Pattern

```typescript
// Resolver error handling
export const Mutation: MutationResolvers = {
  async createArticle(parent, { input }, context) {
    try {
      // Validation
      if (!input.title?.en && !input.title?.te) {
        throw new GraphQLError('Title is required in at least one language', {
          extensions: {
            code: 'VALIDATION_ERROR',
            field: 'title',
            rule: 'required',
          },
        });
      }

      // Business logic
      const article = await Article.create({
        ...input,
        audit: {
          createdBy: context.user.sub,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return article;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key
        throw new GraphQLError('Article with this slug already exists', {
          extensions: {
            code: 'DUPLICATE_KEY',
            field: 'slug',
          },
        });
      }
      throw error;
    }
  },
};
```

## Localization Support

### Multi-language Content

```graphql
"""
Multi-language string supporting English and Telugu
"""
type LocaleString {
  """
  English content
  """
  en: String

  """
  Telugu content (తెలుగు)
  """
  te: String
}

"""
Input for multi-language content
"""
input LocaleStringInput {
  """
  English content
  """
  en: String

  """
  Telugu content (తెలుగు)
  """
  te: String
}
```

### Language-aware Queries

```graphql
type Query {
  """
  Get article with preferred language fallback
  """
  article(
    """
    Article ID
    """
    id: ID!

    """
    Preferred language (falls back to available languages)
    """
    locale: String = "en"
  ): Article

  """
  Get articles filtered by language
  """
  articles(
    filters: ArticleFilters

    """
    Filter by available languages
    """
    locale: String
  ): ArticlesResult!
}
```

### Localized Field Resolvers

```typescript
// Resolver with locale support
export const Article: ArticleResolvers = {
  // Return localized title based on context
  title(parent, args, context) {
    const preferredLocale = context.locale || 'en';
    const title = parent.title;

    // Return preferred locale or fallback
    return {
      en: title.en,
      te: title.te,
      // Could add resolved field for preferred locale
      preferred: title[preferredLocale] || title.en || title.te,
    };
  },
};
```

## Schema Evolution

### Versioning Strategy

1. **Additive Changes**: Always safe
   - Add new fields (nullable)
   - Add new types
   - Add new enum values

2. **Breaking Changes**: Require deprecation
   - Remove fields
   - Change field types
   - Remove enum values
   - Change required fields

### Deprecation Process

```graphql
type Article {
  """
  @deprecated Use 'audit.createdAt' instead. Will be removed in v2.0
  """
  createdAt: DateTime @deprecated(reason: "Use 'audit.createdAt' instead")

  """
  Comprehensive audit information including creation and modification timestamps
  """
  audit: AuditInfo!
}
```

### Migration Strategies

```graphql
# Phase 1: Add new field alongside old
type Article {
  createdAt: DateTime @deprecated(reason: "Use 'audit.createdAt' instead")
  audit: AuditInfo!
}

# Phase 2: Remove deprecated field (next major version)
type Article {
  audit: AuditInfo!
}
```

## Best Practices

### 1. Field Design

```graphql
# ✅ Good: Specific, well-documented fields
type Article {
  """
  Unique identifier for the article
  """
  id: ID!

  """
  Multi-language title supporting English and Telugu
  """
  title: LocaleString!

  """
  Publication timestamp (null if unpublished)
  """
  publishedAt: DateTime
}

# ❌ Bad: Generic, undocumented fields
type Article {
  id: ID!
  data: JSON # Too generic
  info: String # Unclear purpose
}
```

### 2. Relationship Design

```graphql
# ✅ Good: Clear relationship with proper loading
type Article {
  """
  Categories this article belongs to
  """
  categories: [Category!]!

  """
  Tags associated with this article
  """
  tags: [Tag!]!

  """
  Cover image for the article
  """
  cover: MediaAsset
}

# ❌ Bad: Unclear relationships
type Article {
  categoryIds: [String!]! # Forces client to make additional queries
  tagData: JSON # Untyped relationship data
}
```

### 3. Input Validation

```graphql
# ✅ Good: Clear validation rules
input ArticleInput {
  """
  Article type (required, must be 'blog', 'news', or 'announcement')
  """
  type: String!

  """
  Title in at least one language is required
  """
  title: LocaleStringInput!

  """
  Supported locales (must include locales used in content)
  """
  locales: [String!]!
}

# ❌ Bad: Unclear validation
input ArticleInput {
  type: String # Not required, no constraints
  title: String # No localization support
  locales: [String] # Unclear relationship to content
}
```

### 4. Performance Considerations

```graphql
# ✅ Good: Efficient queries with DataLoader
type Article {
  """
  Efficiently loaded categories using DataLoader
  """
  categories: [Category!]!

  """
  Lazily loaded full content (use summary for lists)
  """
  bodyHtml: LocaleString

  """
  Always included summary for list views
  """
  summary: LocaleString
}

# ❌ Bad: N+1 query problems
type Article {
  categories: [Category!]! # Without DataLoader, causes N+1 queries
  bodyHtml: LocaleString # Always loaded, even in lists
}
```

### 5. Documentation Standards

```graphql
"""
Represents a content article in the CMS.

Articles support multi-language content, categorization, tagging,
and a complete publication workflow with audit trails.

Example:
```

{
article(id: "123") {
title { en te }
status
categories { name { en } }
}
}

```
"""
type Article {
  """
  Unique identifier for the article.
  Used for all article operations and relationships.
  """
  id: ID!

  # ... other fields with similar documentation
}
```

## Schema Validation

### Linting Rules

Use GraphQL schema linting with rules:

- Field names must be camelCase
- Type names must be PascalCase
- All fields must have descriptions
- Enum values must be UPPER_SNAKE_CASE
- No unused types or fields

### Validation Tools

```bash
# Validate schema syntax
pnpm run graphql:validate

# Check for breaking changes
pnpm run graphql:diff

# Generate documentation
pnpm run graphql:docs
```

## Resources

- [GraphQL Schema Language](https://graphql.org/learn/schema/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
