# Project Scaffolding - SSBhakthi API

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Configuration Management](#configuration-management)
- [Development Workflow](#development-workflow)
- [Docker Configuration](#docker-configuration)
- [Code Quality & Standards](#code-quality--standards)
- [Testing Strategy](#testing-strategy)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Knowledge Transfer Checklist](#knowledge-transfer-checklist)

## Overview

SSBhakthi API is a modern Node.js backend service built with TypeScript and Express.js. It follows enterprise-grade development practices with comprehensive tooling for code quality, testing, and deployment.

### Key Features

- **Type Safety**: Full TypeScript implementation with strict type checking
- **Modern Framework**: Express.js with modern ES2022 features
- **Database Integration**: MongoDB with Redis for caching
- **Development Tools**: Comprehensive linting, formatting, and testing setup
- **Docker Support**: Complete containerization with development overrides
- **Environment Management**: Secure configuration with dotenv
- **Health Monitoring**: Built-in health check endpoints

## Technology Stack

### Core Technologies

| Technology     | Version    | Purpose              |
| -------------- | ---------- | -------------------- |
| **Node.js**    | 18+        | Runtime environment  |
| **TypeScript** | ^5.9.2     | Type-safe JavaScript |
| **Express.js** | ^5.1.0     | Web framework        |
| **MongoDB**    | 7.0        | Primary database     |
| **Redis**      | 7.2-alpine | Caching and sessions |
| **Docker**     | Latest     | Containerization     |

### Development Tools

| Tool         | Version | Purpose              |
| ------------ | ------- | -------------------- |
| **pnpm**     | 10.15.0 | Package manager      |
| **ESLint**   | ^9.34.0 | Code linting         |
| **Prettier** | ^3.6.2  | Code formatting      |
| **Vitest**   | ^3.2.4  | Testing framework    |
| **tsx**      | ^4.20.4 | TypeScript execution |

## Project Architecture

### High-Level Architecture

```mermaid
graph TB
    A[Client Applications] --> B[Load Balancer]
    B --> C[Express.js API Server]
    C --> D[MongoDB Database]
    C --> E[Redis Cache]
    C --> F[External Services]

    G[Docker Compose] --> H[MongoDB Container]
    G --> I[Redis Container]
    G --> J[Redis Commander]
    G --> K[Mongo Express]
```

### Application Structure

```mermaid
graph TD
    A[server.ts] --> B[app.ts]
    B --> C[Middleware Layer]
    B --> D[Routes Layer]
    B --> E[Error Handling]

    C --> F[Security Headers]
    C --> G[Request Logging]
    C --> H[Body Parsing]

    D --> I[Health Routes]
    D --> J[API Routes]

    K[config/] --> L[app.ts]
    M[types/] --> N[Type Definitions]
    O[middleware/] --> P[Error Handlers]
```

### Layer Responsibilities

1. **Server Layer** (`server.ts`)
   - Application bootstrap
   - Graceful shutdown handling
   - Process signal management

2. **Application Layer** (`app.ts`)
   - Express app configuration
   - Middleware initialization
   - Route registration
   - Error handling setup

3. **Configuration Layer** (`config/`)
   - Environment variable management
   - Application settings
   - Database connections

4. **Routes Layer** (`routes/`)
   - API endpoint definitions
   - Request/response handling
   - Route-specific middleware

5. **Middleware Layer** (`middleware/`)
   - Cross-cutting concerns
   - Error handling
   - Request validation

6. **Types Layer** (`types/`)
   - TypeScript type definitions
   - Interface contracts
   - Data models

## Development Environment Setup

### Prerequisites

```bash
# Required software versions
Node.js: 18.x or higher
pnpm: 10.x or higher
Docker: Latest stable
Docker Compose: v2.x
```

### Initial Setup

1. **Clone and Install Dependencies**

```bash
git clone <repository-url>
cd ssbhakthi_api
pnpm install
```

2. **Environment Configuration**

```bash
cp .env.example .env
# Edit .env with your local configuration
```

3. **Start Development Services**

```bash
# Start Docker services (MongoDB, Redis, Admin UIs)
pnpm run docker:dev

# Start development server
pnpm run dev
```

4. **Verify Installation**

```bash
# Check health endpoint
curl http://localhost:3001/health

# Access admin interfaces
# MongoDB: http://localhost:8082
# Redis: http://localhost:8081
```

## Project Structure

```
ssbhakthi_api/
├── src/                          # Source code
│   ├── app.ts                   # Express application setup
│   ├── server.ts                # Server entry point
│   ├── config/                  # Configuration files
│   │   └── app.ts              # App configuration
│   ├── middleware/              # Custom middleware
│   │   └── error.ts            # Error handling middleware
│   ├── routes/                  # Route definitions
│   │   └── health.ts           # Health check routes
│   └── types/                   # TypeScript type definitions
│       └── config.ts           # Configuration types
├── tests/                       # Test files
├── docker/                      # Docker configuration
│   └── mongo-init/             # MongoDB initialization scripts
├── scripts/                     # Utility scripts
├── dist/                        # Compiled JavaScript (build output)
├── docs/                        # Documentation
├── docker-compose.yml           # Production Docker configuration
├── docker-compose.dev.yml       # Development Docker overrides
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Test configuration
├── eslint.config.js            # Linting configuration
├── .prettierrc                 # Code formatting configuration
├── .env.example                # Environment variables template
└── README.md                   # Project documentation
```

### File Naming Conventions

- **TypeScript files**: `camelCase.ts`
- **Configuration files**: `kebab-case.config.js`
- **Test files**: `fileName.test.ts` or `fileName.spec.ts`
- **Docker files**: `docker-compose.{env}.yml`
- **Documentation**: `UPPER_CASE.md`

## Configuration Management

### Environment Variables

The application uses a hierarchical configuration system:

1. **Default values** in `src/config/app.ts`
2. **Environment-specific** values in `.env` files
3. **Runtime overrides** via environment variables

### Key Configuration Areas

#### Server Configuration

```typescript
export const appConfig: AppConfig = {
  port: parseInt(process.env['PORT'] || '3001', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  mongoUrl: process.env['MONGODB_URL'] || 'mongodb://localhost:27017/ssbhakthi_api',
  redisUrl: process.env['REDIS_URL'] || 'redis://localhost:6379',
};
```

#### Environment Detection

```typescript
export const isProduction = (): boolean => appConfig.nodeEnv === 'production';
export const isDevelopment = (): boolean => appConfig.nodeEnv === 'development';
```

### Configuration Best Practices

- Use `.env.example` as the template for all environments
- Never commit `.env` files to version control
- Validate all environment variables at startup
- Provide sensible defaults for development
- Use strong typing for configuration objects

## Development Workflow

### Daily Development Commands

```bash
# Start development environment
pnpm run docker:dev           # Start databases and admin UIs
pnpm run dev                  # Start API server with hot reload

# Code quality checks
pnpm run lint                 # Check for linting errors
pnpm run lint:fix            # Fix auto-fixable linting issues
pnpm run format              # Format code with Prettier
pnpm run type-check          # Type check without compilation

# Testing
pnpm run test                # Run tests in watch mode
pnpm run test:run           # Run tests once
pnpm run test:coverage      # Run tests with coverage report
pnpm run test:ui            # Open Vitest UI

# Building and deployment
pnpm run build              # Compile TypeScript to JavaScript
pnpm run start              # Start production server
pnpm run clean              # Clean build artifacts
```

### Git Workflow

1. **Feature Development**

```bash
git checkout -b feature/feature-name
# Make changes
pnpm run lint:fix
pnpm run format
pnpm run test:run
git commit -m "feat: add new feature"
```

2. **Code Quality Checks**

```bash
# Pre-commit checks (automated)
- ESLint validation
- Prettier formatting
- TypeScript compilation
- Unit tests
```

### Development Server Features

- **Hot Reload**: Automatic server restart on file changes
- **Type Checking**: Real-time TypeScript validation
- **Request Logging**: Detailed HTTP request logging
- **Error Handling**: Comprehensive error reporting

## Docker Configuration

### Service Architecture

The application uses Docker Compose for local development:

```yaml
services:
  mongodb: # Primary database
  redis: # Cache and session store
  redis-commander: # Redis admin UI (port 8081)
  mongo-express: # MongoDB admin UI (port 8082)
```

### Development vs Production

#### Development Configuration (`docker-compose.dev.yml`)

- Exposed ports for all services
- Development passwords
- Volume mounts for data persistence
- Admin UI interfaces enabled

#### Production Configuration (`docker-compose.yml`)

- Secured with production passwords
- Optimized for performance
- Health checks enabled
- Network isolation

### Docker Commands

```bash
# Development environment
pnpm run docker:dev           # Start all services
pnpm run docker:dev:down      # Stop all services

# Production environment
pnpm run docker:up            # Start production services
pnpm run docker:down          # Stop all services

# Maintenance
pnpm run docker:logs          # View service logs
pnpm run docker:clean         # Remove volumes and orphaned containers
```

### Service Access Points

| Service         | Development URL       | Production URL             |
| --------------- | --------------------- | -------------------------- |
| API Server      | http://localhost:3001 | Configured via environment |
| MongoDB         | localhost:27017       | Internal network only      |
| Redis           | localhost:6379        | Internal network only      |
| Mongo Express   | http://localhost:8082 | Disabled                   |
| Redis Commander | http://localhost:8081 | Disabled                   |

## Code Quality & Standards

### TypeScript Configuration

The project uses strict TypeScript configuration for maximum type safety:

```typescript
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    // ... additional strict checks
  }
}
```

### ESLint Rules

Key linting rules enforced:

```javascript
{
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "@typescript-eslint/explicit-function-return-type": "warn",
  "@typescript-eslint/no-explicit-any": "warn",
  "no-console": "warn",
  "prefer-const": "error",
  "no-var": "error"
}
```

### Code Style Guidelines

1. **Function Signatures**

```typescript
// ✅ Good: Explicit return types
public listen(): void {
  // implementation
}

// ❌ Avoid: Implicit return types
public listen() {
  // implementation
}
```

2. **Error Handling**

```typescript
// ✅ Good: Typed error interfaces
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// ✅ Good: Comprehensive error handling
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // implementation
};
```

3. **Configuration Management**

```typescript
// ✅ Good: Typed configuration
export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUrl: string;
  redisUrl: string;
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## Testing Strategy

### Test Framework: Vitest

The project uses Vitest for its excellent TypeScript support and performance:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    reporters: ['verbose'],
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── config/             # Configuration tests
│   ├── middleware/         # Middleware tests
│   └── routes/             # Route tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   └── database/          # Database tests
├── e2e/                   # End-to-end tests
└── helpers/               # Test utilities
```

### Testing Best Practices

1. **Test File Naming**

```
src/routes/health.ts -> tests/unit/routes/health.test.ts
```

2. **Test Structure**

```typescript
describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

3. **Coverage Requirements**

- Minimum 80% code coverage
- 100% coverage for critical paths
- All public APIs must be tested

## API Documentation

### Health Check Endpoints

#### GET /health

Returns the application health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

#### GET /

Returns basic application information.

**Response:**

```json
{
  "message": "SSBhakthi API Server",
  "version": "1.0.0",
  "environment": "development"
}
```

### API Response Standards

All API responses follow consistent formats:

1. **Success Response**

```json
{
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

2. **Error Response**

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Deployment

### Build Process

1. **Local Build**

```bash
pnpm run clean
pnpm run build
pnpm run start
```

2. **Production Build**

```bash
# Install dependencies
pnpm install --frozen-lockfile --prod

# Build application
pnpm run build

# Start production server
NODE_ENV=production pnpm run start:prod
```

### Environment Setup

1. **Development**

```bash
NODE_ENV=development
PORT=3001
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api
REDIS_URL=redis://:devpassword123@localhost:6379
```

2. **Production**

```bash
NODE_ENV=production
PORT=8080
MONGODB_URL=mongodb://username:password@mongodb-host:27017/ssbhakthi_api
REDIS_URL=redis://:password@redis-host:6379
```

### Health Monitoring

Monitor these endpoints for deployment health:

- `GET /health` - Application health
- Application logs for errors
- Database connectivity
- Redis connectivity

## Troubleshooting

### Common Issues

#### 1. Redis Commander Not Accessible

**Symptoms:**

- `http://localhost:8081` not accessible
- Container restarting continuously

**Solution:**

```bash
# Check container logs
docker logs ssbhakthi_redis_commander

# Verify configuration in docker-compose.dev.yml
REDIS_HOSTS: local:redis:6379:0:devpassword123
```

#### 2. TypeScript Compilation Errors

**Symptoms:**

- Build failures
- Type checking errors

**Solution:**

```bash
# Check TypeScript configuration
pnpm run type-check

# Fix common issues
- Ensure all imports have type definitions
- Check for unused variables (use _ prefix)
- Verify interface implementations
```

#### 3. Database Connection Issues

**Symptoms:**

- Application startup failures
- MongoDB connection errors

**Solution:**

```bash
# Verify Docker services
docker ps

# Check MongoDB logs
docker logs ssbhakthi_mongodb

# Verify connection string
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin
```

#### 4. Port Conflicts

**Symptoms:**

- "Port already in use" errors
- Service startup failures

**Solution:**

```bash
# Find processes using ports
lsof -i :3001  # API server
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis
lsof -i :8081  # Redis Commander
lsof -i :8082  # Mongo Express

# Kill conflicting processes or change ports
```

### Debug Mode

Enable detailed logging:

```bash
# Development with debug logs
DEBUG=app:* pnpm run dev

# Production with verbose logging
LOG_LEVEL=debug pnpm run start:prod
```

### Performance Monitoring

Monitor these metrics:

1. **Application Metrics**
   - Response times
   - Memory usage
   - CPU utilization
   - Error rates

2. **Database Metrics**
   - MongoDB connection pool
   - Query performance
   - Redis cache hit rates

## Knowledge Transfer Checklist

### New Developer Onboarding

#### Week 1: Environment Setup

- [ ] Clone repository and install dependencies
- [ ] Set up development environment (.env configuration)
- [ ] Start Docker services successfully
- [ ] Run development server and access health endpoints
- [ ] Access admin UIs (MongoDB Express, Redis Commander)
- [ ] Run all tests successfully
- [ ] Complete first code formatting and linting cycle

#### Week 2: Code Understanding

- [ ] Review project architecture and structure
- [ ] Understand TypeScript configuration and type system
- [ ] Review middleware implementation and flow
- [ ] Understand error handling mechanisms
- [ ] Review configuration management system
- [ ] Understand Docker setup and service interactions

#### Week 3: Development Practice

- [ ] Make first code contribution (bug fix or small feature)
- [ ] Write comprehensive tests for changes
- [ ] Follow Git workflow and code review process
- [ ] Demonstrate understanding of coding standards
- [ ] Successfully deploy changes to development environment

#### Ongoing: Mastery

- [ ] Contribute to architecture decisions
- [ ] Mentor other new developers
- [ ] Optimize performance and monitoring
- [ ] Contribute to documentation improvements

### Essential Resources

1. **Documentation**
   - This scaffolding guide
   - README.md for quick start
   - API documentation (when available)
   - Architecture decision records

2. **Tools and Extensions**
   - VS Code with TypeScript support
   - ESLint and Prettier extensions
   - Docker Desktop
   - Postman or similar API testing tool

3. **Key Contacts**
   - Project lead for architecture questions
   - DevOps team for deployment issues
   - Database administrator for data questions

### Success Criteria

A new developer is considered fully onboarded when they can:

1. **Independently set up** the complete development environment
2. **Navigate and understand** the codebase structure
3. **Follow development workflows** without assistance
4. **Write code that meets** quality standards and passes all checks
5. **Debug common issues** using the troubleshooting guide
6. **Contribute meaningful features** or fixes to the project

---

## Conclusion

This scaffolding document provides a comprehensive foundation for understanding and contributing to the SSBhakthi API project. It should be updated regularly as the project evolves and new patterns emerge.

For questions or clarifications about any section, please reach out to the development team or create an issue in the project repository.

**Last Updated:** 2024-01-01  
**Document Version:** 1.0.0  
**Project Version:** 1.0.0
