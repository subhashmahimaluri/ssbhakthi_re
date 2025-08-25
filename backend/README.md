# SSBhakthi API

A production-ready TypeScript Node.js backend built with Express, featuring GraphQL API, MongoDB, Redis, Keycloak JWT authentication, comprehensive testing with Vitest, and development tools.

## 🚀 Features

- **GraphQL API** - Apollo Server with SDL-first approach, authentication, and role-based access control
- **REST API** - Express.js endpoints for file uploads and health checks
- **TypeScript** - Full TypeScript support with strict type checking and auto-generated GraphQL types
- **Authentication** - Keycloak JWT authentication with JWKS verification
- **Database** - MongoDB with Mongoose ODM and optimized indexes
- **Caching** - Redis integration with DataLoader for efficient queries
- **Testing** - Comprehensive test suite with Vitest and Supertest
- **Security** - GraphQL depth/cost limiting, role-based guards, and production-ready configurations
- **Developer Experience** - GraphQL Playground, code generation, and hot reload
- **Docker Compose** - Container orchestration for databases and development environment

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Docker and Docker Compose

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ssbhakthi_api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start databases with Docker Compose**

   ```bash
   pnpm run docker:dev
   ```

5. **Run the development server**
   ```bash
   pnpm run dev
   ```

## 🎯 Commands

### Development

```bash
# Start development server with hot reload
pnpm run dev

# Build the project
pnpm run build

# Start production server
pnpm run start

# Start production server with NODE_ENV=production
pnpm run start:prod

# Generate GraphQL TypeScript types
pnpm run codegen

# Generate types and start dev server
pnpm run dev:codegen
```

### Testing

```bash
# Run tests in watch mode
pnpm run test

# Run tests with UI
pnpm run test:ui

# Run tests once
pnpm run test:run

# Run tests with coverage
pnpm run test:coverage
```

### Code Quality

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code with Prettier
pnpm run format

# Check code formatting
pnpm run format:check

# Type check without building
pnpm run type-check
```

### Docker & Database

```bash
# Start databases (production mode)
pnpm run docker:up

# Start databases (development mode)
pnpm run docker:dev

# Stop databases
pnpm run docker:down
pnpm run docker:dev:down

# View database logs
pnpm run docker:logs

# Clean up databases and volumes
pnpm run docker:clean

# Seed database with initial data
pnpm run db:seed
```

### Utilities

```bash
# Clean build and coverage directories
pnpm run clean
```

## 🏗️ Project Structure

```
src/
├── app.ts                    # Express application setup with GraphQL integration
├── server.ts                 # Server entry point
├── auth/                     # Authentication & authorization
│   └── jwt.ts               # Keycloak JWT middleware
├── config/                   # Configuration files
│   ├── app.ts               # Application configuration
│   └── database.ts          # MongoDB connection
├── graphql/                  # GraphQL implementation
│   ├── schema.graphql       # GraphQL SDL schema
│   ├── resolvers/           # GraphQL resolvers
│   │   ├── Query.ts         # Query resolvers
│   │   ├── Mutation.ts      # Mutation resolvers
│   │   ├── Article.ts       # Article field resolvers
│   │   ├── scalars.ts       # Custom scalar types
│   │   ├── loaders.ts       # DataLoader instances
│   │   └── directives.ts    # Auth directive transformers
│   └── __generated__/       # Auto-generated TypeScript types
│       └── types.ts         # GraphQL TypeScript definitions
├── middleware/               # Express middlewares
│   └── error.ts             # Error handling middleware
├── models/                   # Mongoose models
│   ├── Article.ts           # Article model with audit trail
│   ├── Category.ts          # Category model with localization
│   ├── Tag.ts               # Tag model with language support
│   ├── MediaAsset.ts        # Media asset model
│   └── User.ts              # User model with Keycloak integration
├── routes/                   # REST API routes
│   ├── health.ts            # Health check routes
│   └── media.ts             # Media upload routes
└── types/                    # TypeScript type definitions
    └── config.ts            # Configuration types

tests/                        # Test files
├── graphql-api.test.ts       # GraphQL API tests
└── health.test.ts            # Health endpoint tests

codegen.ts                    # GraphQL Code Generator configuration
scripts/                      # Utility scripts
docker/                       # Docker configuration
```

## 🌐 API Endpoints

### GraphQL API

- **POST** `/graphql` - GraphQL API endpoint
- **GET** `/graphql` - GraphQL Playground (development only)

#### Sample Queries

**Ping Query (Public)**

```graphql
{
  ping
}
# Returns: { "ping": "pong" }
```

**Articles Query (Public)**

```graphql
{
  articles(limit: 10, offset: 0) {
    items {
      id
      title {
        en
        te
      }
      slug {
        en
        te
      }
      status
      type
      locales
      audit {
        createdAt
        updatedAt
        createdBy
      }
    }
    total
    hasNextPage
    hasPreviousPage
  }
}
```

**Filtered Articles Query**

```graphql
{
  articles(
    filters: { type: "blog", status: PUBLISHED, locale: "en", search: "tutorial" }
    limit: 5
    sort: "-audit.updatedAt"
  ) {
    items {
      id
      title {
        en
      }
      summary {
        en
      }
      cover {
        url
        alt
      }
      categories {
        name {
          en
        }
        slug {
          en
        }
      }
      tags {
        name
        lang
      }
    }
    total
  }
}
```

**User Profile Query (Authenticated)**

```graphql
# Requires Authorization: Bearer <jwt-token>
{
  me {
    id
    email
    roles
    firstName
    lastName
  }
}
```

#### Sample Mutations

**Create Article (Requires author/editor/admin role)**

```graphql
mutation {
  createArticle(
    input: {
      type: "blog"
      title: { en: "Getting Started with GraphQL", te: "GraphQL తో ప్రారంభం" }
      slug: { en: "getting-started-with-graphql", te: "graphql-తో-ప్రారంభం" }
      summary: { en: "Learn the basics of GraphQL", te: "GraphQL ఆధారాలు నేరుకోండి" }
      bodyHtml: {
        en: "<p>GraphQL is a powerful query language...</p>"
        te: "<p>GraphQL ఒక శక్తివంతమైన క్వెరీ భాష...</p>"
      }
      locales: ["en", "te"]
      categories: ["60f1b2b3c4a5b6c7d8e9f0a1"]
      tags: ["60f1b2b3c4a5b6c7d8e9f0a2"]
      status: DRAFT
    }
  ) {
    id
    title {
      en
      te
    }
    status
    revision
    audit {
      createdAt
      createdBy
    }
  }
}
```

**Update Article Status (Requires editor/admin role)**

```graphql
mutation {
  changeStatus(
    id: "60f1b2b3c4a5b6c7d8e9f0a3"
    status: PUBLISHED
    publishAt: "2024-01-01T00:00:00Z"
  ) {
    id
    status
    audit {
      updatedAt
      updatedBy
    }
  }
}
```

#### Authentication

GraphQL endpoints support Keycloak JWT authentication:

```bash
# Include JWT token in Authorization header
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"query": "{ me { id email } }"}'
```

#### Security Features

- **Depth Limiting**: Queries limited to 8 levels deep (configurable)
- **Cost Analysis**: Complex queries have cost limits (default: 15000)
- **Role-based Access**: Mutations require specific roles (author, editor, admin)
- **Introspection**: Disabled in production for security

### REST API

#### Health Check

- **GET** `/rest/health` - Returns application health status

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

#### Media Upload

- **POST** `/rest/media/upload` - Upload media files (Requires authentication)

```bash
curl -X POST http://localhost:4000/rest/media/upload \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@image.jpg" \
  -F "alt=Sample image" \
  -F "caption=A beautiful sample image"
```

#### Root

- **GET** `/` - Returns API information

```json
{
  "message": "SSBhakthi API Server",
  "version": "1.0.0",
  "environment": "development",
  "endpoints": {
    "graphql": "/graphql",
    "health": "/rest/health",
    "mediaUpload": "/rest/media/upload"
  }
}
```

## 🐳 Docker Services

The project includes Docker Compose configuration for:

- **MongoDB** (Port 27017)
  - Admin UI: http://localhost:8082 (admin/admin)
- **Redis** (Port 6379)
  - Admin UI: http://localhost:8081
- **Redis Commander** - Redis management interface
- **Mongo Express** - MongoDB management interface

## 🔧 Configuration

Environment variables are managed through `.env` files:

- `.env.example` - Template with all available options
- `.env` - Development configuration (not tracked in git)

### Core Configuration

- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production/test)
- `MONGODB_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string

### GraphQL Configuration

- `GRAPHQL_PLAYGROUND` - Enable GraphQL Playground (default: true in development)
- `GRAPHQL_MAX_DEPTH` - Maximum query depth (default: 8)
- `GRAPHQL_MAX_COST` - Maximum query cost (default: 15000)
- `GRAPHQL_INTROSPECTION` - Enable introspection (default: true in development)

### Keycloak Authentication

- `KEYCLOAK_ISSUER` - Keycloak realm issuer URL
- `KEYCLOAK_JWKS_URL` - JWKS endpoint for token verification
- `KEYCLOAK_AUDIENCE` - Expected audience in JWT tokens

### Security & CORS

- `JWT_SECRET` - JWT secret for token verification (fallback)
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `CORS_CREDENTIALS` - Allow credentials in CORS (default: true)

### Rate Limiting

- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

### File Upload

- `MAX_FILE_SIZE` - Maximum file upload size (default: 10mb)
- `UPLOAD_DIRECTORY` - Directory for uploaded files

### Example .env Configuration

```bash
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin
REDIS_URL=redis://:devpassword123@localhost:6379

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COST=15000
GRAPHQL_INTROSPECTION=true

# Keycloak
KEYCLOAK_ISSUER=https://keycloak.example.com/realms/ssbhakthi
KEYCLOAK_JWKS_URL=https://keycloak.example.com/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
CORS_CREDENTIALS=true
```

## 🧪 Testing

The project uses Vitest for comprehensive testing with:

### Test Types

- **GraphQL API Tests** - Query and mutation testing with authentication
- **REST API Tests** - Health checks and media upload endpoints
- **Authentication Tests** - JWT token validation and role-based access
- **Integration Tests** - End-to-end API workflows
- **Unit Tests** - Individual resolver and middleware testing

### Test Features

- **Code Coverage** - Comprehensive coverage reporting
- **Watch Mode** - Live reload during development
- **UI Interface** - Visual test runner and results
- **Supertest Integration** - HTTP endpoint testing
- **Mock Authentication** - Test JWT tokens for different roles

### Test Structure

```
tests/
├── graphql-api.test.ts       # GraphQL endpoint tests
│                           # • Ping queries
│                           # • Article queries with filtering
│                           # • Authentication validation
│                           # • Role-based access control
│                           # • GraphQL Playground access
└── health.test.ts            # REST health endpoint tests
```

### Running Tests

```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm run test graphql-api.test.ts

# Run tests with coverage
pnpm run test:coverage

# Run tests once (CI mode)
pnpm run test:run
```

### Test Environment

Tests automatically:

- Start test database connections
- Initialize GraphQL server
- Set up authentication middleware
- Clean up after test completion

## 📝 Code Quality

- **ESLint** - Configured with TypeScript rules
- **Prettier** - Code formatting with sensible defaults
- **TypeScript** - Strict type checking enabled
- **Git Hooks** - Pre-commit validation (when Husky is configured)

## 🚦 Development Workflow

### Initial Setup

1. Clone repository and install dependencies: `pnpm install`
2. Copy environment configuration: `cp .env.example .env`
3. Start databases: `pnpm run docker:dev`
4. Start development server: `pnpm run dev`

### GraphQL Development

1. **Schema Changes**: Edit `src/graphql/schema.graphql`
2. **Generate Types**: Run `pnpm run codegen` to update TypeScript types
3. **Update Resolvers**: Implement resolvers in `src/graphql/resolvers/`
4. **Test Changes**: Use GraphQL Playground at http://localhost:4000/graphql
5. **Write Tests**: Add tests to `tests/graphql-api.test.ts`

### Daily Development

1. Start services: `pnpm run docker:dev && pnpm run dev`
2. Make changes and see live reload
3. Test GraphQL queries in Playground
4. Run tests: `pnpm run test`
5. Generate types after schema changes: `pnpm run codegen`
6. Check code quality: `pnpm run lint && pnpm run format:check`

### Authentication Development

1. **Testing with Keycloak**: Set up local Keycloak instance
2. **Mock Tokens**: Use test JWT tokens for development
3. **Role Testing**: Test different user roles (author, editor, admin)
4. **Security Validation**: Verify depth/cost limits work correctly

## 📊 Monitoring

- Health check endpoint for monitoring
- Request logging middleware
- Error handling with stack traces in development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: Change the `PORT` in `.env`
2. **Docker containers won't start**: Ensure Docker is running
3. **Database connection failed**: Check MongoDB/Redis containers are running
4. **TypeScript errors**: Run `pnpm run type-check` for detailed errors
5. **GraphQL Playground not loading**: Ensure `GRAPHQL_PLAYGROUND=true` in `.env`
6. **Authentication failures**: Verify Keycloak JWKS URL is accessible
7. **GraphQL types out of sync**: Run `pnpm run codegen` after schema changes
8. **Query depth/cost exceeded**: Adjust `GRAPHQL_MAX_DEPTH` and `GRAPHQL_MAX_COST`

### Development URLs

- **API Server**: http://localhost:4000
- **GraphQL Playground**: http://localhost:4000/graphql
- **Health Check**: http://localhost:4000/rest/health
- **REST Media Upload**: http://localhost:4000/rest/media/upload
- **MongoDB Admin**: http://localhost:8082 (admin/admin)
- **Redis Admin**: http://localhost:8081

### GraphQL Development Tips

1. **Use Playground**: Test queries interactively at `/graphql`
2. **Check Schema**: Use introspection to explore available types and fields
3. **Authentication Testing**: Include `Authorization: Bearer <token>` header
4. **Role Testing**: Test with different user roles in JWT payload
5. **Performance**: Use DataLoader to avoid N+1 query problems
6. **Security**: Test depth and cost limiting with complex nested queries

### Production Considerations

1. **Environment Variables**: Set `NODE_ENV=production`
2. **Security**: Disable introspection (`GRAPHQL_INTROSPECTION=false`)
3. **GraphQL Playground**: Disable in production (`GRAPHQL_PLAYGROUND=false`)
4. **Rate Limiting**: Configure appropriate limits for your use case
5. **Monitoring**: Set up health check monitoring
6. **Database**: Use MongoDB Atlas or similar managed service
7. **Authentication**: Configure proper Keycloak realm and client settings

## 🔐 Keycloak Authentication

To set up Keycloak for authentication:

```bash
# Start Keycloak with Postgres database
docker compose -f docker-compose.keycloak.yml up -d
```

After starting Keycloak:

- Admin Console: http://localhost:8080/
- Admin credentials: `admin` / `admin`
- Realm: `ssbhakthi` (auto-imported)
- Test user: `editor1` / `Passw0rd!`

For more detailed Keycloak configuration, see [infra/keycloak/README.md](infra/keycloak/README.md)
