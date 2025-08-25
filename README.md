# SSBhakthi Monorepo

A powerful full-stack monorepo featuring a multilingual Next.js frontend and a Node.js/GraphQL backend with comprehensive authentication, database integration, and Docker orchestration.

## 🏗️ Architecture

```
ssbhakthi-monorepo/
├── 🖥️ backend/          # Node.js + Express + GraphQL API
│   ├── MongoDB + Mongoose
│   ├── Redis + DataLoader
│   ├── Keycloak JWT Auth
│   ├── Apollo Server
│   └── Comprehensive Testing
├── 🌐 frontend/         # Next.js Multilingual App
│   ├── Telugu (తెలుగు) - Port 3000
│   ├── English - Port 3000/en
│   ├── Hindi (हिंदी) - Port 3001
│   ├── Kannada (ಕನ್ನಡ) - Port 3002
│   ├── Admin Panel + CKEditor
│   └── Bootstrap + TypeScript
└── 🐳 Docker Services    # Unified Infrastructure
    ├── MongoDB + Admin UI
    ├── Redis + Commander
    └── Keycloak + PostgreSQL
```

## ✨ Features

### Backend (Node.js + GraphQL)

- **GraphQL API** - Apollo Server with SDL-first approach
- **Authentication** - Keycloak JWT with role-based access control
- **Database** - MongoDB with Mongoose ODM and optimized indexes
- **Caching** - Redis integration with DataLoader for efficient queries
- **Testing** - Comprehensive test suite with Vitest and Supertest
- **Security** - GraphQL depth/cost limiting, role-based guards
- **Docker** - Container orchestration for databases and services

### Frontend (Next.js Multilingual)

- **Multi-Instance Architecture** - Each language runs on dedicated ports
- **4 Languages** - Telugu, English, Hindi, Kannada
- **Admin Panel** - Keycloak-secured content management with RBAC
- **Rich Editor** - CKEditor 5 with image uploads
- **SEO Optimized** - Proper meta tags and static generation
- **Responsive Design** - React Bootstrap components
- **TypeScript** - Full type safety throughout

### Monorepo Benefits

- **Unified Development** - Single command starts all services
- **Shared Dependencies** - Optimized package management with pnpm
- **Consistent Tooling** - Shared linting, formatting, and build tools
- **Docker Integration** - All services orchestrated from root
- **VS Code Workspace** - Optimized development experience

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Docker** & Docker Compose
- **Git**

### 1. Clone & Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd ssbhakthi-monorepo

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Full setup (installs dependencies, starts Docker, seeds database)
pnpm run setup
```

### 2. Development

```bash
# Start everything (Docker + Backend + All Frontend instances + Keycloak)
pnpm run dev

# Or use the helper script
./dev.sh dev
```

**🎉 You're ready!** Open these URLs:

- **Telugu**: http://localhost:3000
- **English**: http://localhost:3000/en
- **Hindi**: http://localhost:3001
- **Kannada**: http://localhost:3002
- **Backend API**: http://localhost:4000/graphql
- **Keycloak Admin**: http://localhost:8080/admin (admin/admin)
- **MongoDB Admin**: http://localhost:8082 (admin/admin)
- **Redis Admin**: http://localhost:8081

## 📋 Available Scripts

### Development

```bash
# Full development environment
pnpm run dev                 # All services + frontend + backend + Keycloak
pnpm run dev:with-docker     # Starts Docker first, then development

# Individual services
pnpm run dev:backend         # Backend only
pnpm run dev:frontend        # All frontend instances
pnpm run dev:frontend:te     # Telugu/English only
pnpm run dev:frontend:hi     # Hindi only
pnpm run dev:frontend:kn     # Kannada only
```

### Docker Management

```bash
# Basic services (MongoDB + Redis)
pnpm run docker:up           # Start
pnpm run docker:down         # Stop
pnpm run docker:logs         # View logs

# All services (includes Keycloak)
pnpm run docker:all:up       # Start all
pnpm run docker:all:down     # Stop all
pnpm run docker:clean        # Clean volumes

# Development helper
pnpm run quick-start         # Docker + Development
```

### Build & Production

```bash
# Build everything
pnpm run build               # Backend + All frontend instances

# Individual builds
pnpm run build:backend       # Backend only
pnpm run build:frontend      # All frontend instances
pnpm run build:frontend:te   # Telugu/English only
pnpm run build:frontend:hi   # Hindi only
pnpm run build:frontend:kn   # Kannada only

# Production start
pnpm run start              # All production servers
pnpm run start:prod         # With NODE_ENV=production
```

### Testing & Quality

```bash
# Testing
pnpm run test               # All tests
pnpm run test:backend       # Backend tests only
pnpm run test:frontend      # Frontend linting

# Code quality
pnpm run lint               # Lint all
pnpm run lint:fix           # Fix linting issues
pnpm run format             # Format all code
pnpm run type-check         # TypeScript validation
```

### Database & Tools

```bash
# Database
pnpm run db:seed            # Seed with initial data
pnpm run codegen           # Generate GraphQL types

# Utilities
pnpm run check-ports        # Check what's running
pnpm run kill-ports         # Kill development processes
pnpm run clean              # Clean all build artifacts
```

## 🛠️ Development Script

Use the included `dev.sh` script for easier management:

```bash
# Make executable (once)
chmod +x dev.sh

# Available commands
./dev.sh setup             # Initial setup
./dev.sh dev               # Start development
./dev.sh dev-quick         # Quick start (minimal Docker)
./dev.sh docker-up         # Start Docker services
./dev.sh status            # Show service status
./dev.sh stop              # Stop all services
./dev.sh clean             # Clean everything
./dev.sh reset             # Full reset
```

## 🐳 Docker Services

The monorepo includes unified Docker management:

| Service  | Port  | Admin UI    | Credentials |
| -------- | ----- | ----------- | ----------- |
| MongoDB  | 27017 | :8082       | admin/admin |
| Redis    | 6379  | :8081       | admin/admin |
| Keycloak | 8080  | :8080/admin | admin/admin |

### Service URLs

- **MongoDB Admin**: http://localhost:8082
- **Redis Commander**: http://localhost:8081
- **Keycloak Admin**: http://localhost:8080/admin
- **GraphQL Playground**: http://localhost:4000/graphql

## 🌐 Frontend Language Configuration

### Port Mapping

| Language        | URL               | Port | Instance       |
| --------------- | ----------------- | ---- | -------------- |
| Telugu (తెలుగు) | localhost:3000    | 3000 | Multi-locale   |
| English         | localhost:3000/en | 3000 | Same as Telugu |
| Hindi (हिंदी)   | localhost:3001    | 3001 | Single-locale  |
| Kannada (ಕನ್ನಡ) | localhost:3002    | 3002 | Single-locale  |

### Language Switching

- **Same-instance** (Telugu ↔ English): Uses Next.js routing
- **Cross-instance** (Hindi/Kannada): Redirects to different ports
- **Context preservation**: Maintains current page and query parameters

## 🔐 Authentication Setup

### Keycloak Configuration

1. **Start Keycloak**:

   ```bash
   pnpm run docker:keycloak:up
   ```

2. **Access Admin Console**: http://localhost:8080/admin

   - Username: `admin`
   - Password: `admin`

3. **Realm**: `ssbhakthi` (auto-imported)
4. **Test User**: `editor1` / `Passw0rd!`

### Environment Variables

Key variables for authentication:

```env
# Keycloak
KEYCLOAK_ISSUER=http://localhost:8080/realms/ssbhakthi
KEYCLOAK_CLIENT_ID=admin-app
KEYCLOAK_CLIENT_SECRET=your_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# API Endpoints
BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
```

## 📊 Admin Panel

Access the admin panel at any frontend instance:

- **Telugu/English**: http://localhost:3000/admin
- **Hindi**: http://localhost:3001/admin
- **Kannada**: http://localhost:3002/admin

### Admin Features

- **Article Management** - CRUD with rich text editor
- **Media Upload** - File management and organization
- **Multi-language** - Content in all supported languages
- **Role-based Access** - Admin, Editor, Author roles
- **ISR Revalidation** - Webhook-based cache invalidation

### Default Roles

- **admin**: Full system access
- **editor**: Content and media management
- **author**: Create and edit own content

## 🏗️ Project Structure

```
ssbhakthi-monorepo/
├── 📄 package.json              # Root package management
├── 📄 pnpm-workspace.yaml       # Workspace configuration
├── 📄 docker-compose.yml        # Unified Docker services
├── 📄 .env.example              # Environment template
├── 📄 dev.sh                    # Development helper script
├── 📄 ssbhakthi-monorepo.code-workspace # VS Code workspace
├──
├── 🖥️ backend/                 # Node.js API Server
│   ├── src/
│   │   ├── graphql/            # GraphQL schema & resolvers
│   │   ├── models/             # Mongoose models
│   │   ├── auth/               # JWT authentication
│   │   ├── routes/             # REST endpoints
│   │   └── config/             # App configuration
│   ├── tests/                  # Test suite
│   ├── docker/                 # Docker configurations
│   └── scripts/                # Utility scripts
│
└── 🌐 frontend/                # Next.js Application
    ├── app/                    # Next.js App Router
    ├── components/             # React components
    ├── pages/                  # Pages Router (legacy)
    ├── locales/                # Translation files
    ├── lib/                    # Utility libraries
    ├── hooks/                  # Custom React hooks
    └── styles/                 # SCSS stylesheets
```

## 🔧 Configuration Files

### Root Level

- `package.json` - Monorepo scripts and dependencies
- `pnpm-workspace.yaml` - Workspace configuration
- `docker-compose.yml` - Docker services orchestration
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore patterns for entire monorepo

### Backend (`/backend`)

- `package.json` - Backend dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `codegen.ts` - GraphQL code generation
- `vitest.config.ts` - Testing configuration

### Frontend (`/frontend`)

- `package.json` - Frontend dependencies and scripts
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

## 🚦 Development Workflow

### Daily Development

1. **Start Services**:

   ```bash
   ./dev.sh dev
   # or
   pnpm run dev
   ```

2. **Make Changes**: Edit code in `backend/` or `frontend/`

3. **Hot Reload**: Changes are automatically reflected

4. **Test**:
   ```bash
   pnpm run test
   ```

### Adding New Features

1. **Backend Changes**:
   - Update GraphQL schema
   - Generate types: `pnpm run codegen`
   - Add resolvers and tests
2. **Frontend Changes**:
   - Add translations to all language files
   - Update components and pages
   - Test on all language instances

### Database Management

```bash
# Reset database
./dev.sh docker-clean
./dev.sh docker-up
pnpm run db:seed

# View data
# MongoDB: http://localhost:8082
# Redis: http://localhost:8081
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
pnpm run test           # Watch mode
pnpm run test:run       # Single run
pnpm run test:coverage  # With coverage
pnpm run test:ui        # Visual interface
```

### Testing Coverage

- **GraphQL API** - Query and mutation testing
- **Authentication** - JWT validation and roles
- **Integration** - End-to-end API workflows
- **Unit Tests** - Individual resolvers and middleware

## 🎯 Production Deployment

### Option 1: Separate Servers

Deploy each language instance on separate servers with Docker.

### Option 2: Single Server + Reverse Proxy

Use nginx to route different domains to different ports:

```nginx
# Telugu/English
server {
    server_name yourdomain.com;
    location / { proxy_pass http://localhost:3000; }
}

# Hindi
server {
    server_name hi.yourdomain.com;
    location / { proxy_pass http://localhost:3001; }
}

# Kannada
server {
    server_name kn.yourdomain.com;
    location / { proxy_pass http://localhost:3002; }
}
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Keycloak configured for production domain
- [ ] Admin users created
- [ ] Backup procedures established
- [ ] Monitoring and logging configured

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**:

```bash
pnpm run kill-ports
# or
./dev.sh stop
```

**Docker Issues**:

```bash
./dev.sh docker-clean
./dev.sh docker-up
```

**Build Errors**:

```bash
./dev.sh clean
pnpm install
pnpm run build
```

**Full Reset**:

```bash
./dev.sh reset
```

### Service Status

Check what's running:

```bash
./dev.sh status
# or
pnpm run check-ports
```

### Logs

```bash
# Docker services
pnpm run docker:logs

# Application logs
# Check terminal output where services are running
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/new-feature`
3. **Add translations** for all supported languages
4. **Test** on all instances: `pnpm run test`
5. **Commit** changes: `git commit -m 'Add new feature'`
6. **Push** to branch: `git push origin feature/new-feature`
7. **Submit** a pull request

### Development Guidelines

- Add translations for all 4 languages
- Test on all frontend instances
- Write tests for new backend features
- Follow existing code style and conventions
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the individual project LICENSE files for details.

## 🙏 Acknowledgments

- **Next.js** team for excellent i18n and SSR support
- **Apollo** team for powerful GraphQL tooling
- **Keycloak** for enterprise-grade authentication
- **MongoDB** and **Redis** for reliable data storage
- **Docker** for consistent development environments

## 📞 Support

If you encounter issues:

1. Check this [troubleshooting section](#-troubleshooting)
2. Check service status: `./dev.sh status`
3. View logs: `pnpm run docker:logs`
4. Create an issue with:
   - Operating system and versions
   - Error messages and logs
   - Steps to reproduce

---

**Happy coding! 🚀**

_Built with ❤️ for the multilingual web community_
