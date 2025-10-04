# Environment Configuration for Production

## 🚀 Production Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
MONGODB_URL=mongodb://username:password@your-mongodb-host:27017/ssbhakthi_api?authSource=admin
REDIS_URL=redis://username:password@your-redis-host:6379

# API URLs (Production)
BACKEND_GRAPHQL_URL=https://api.yourdomain.com/graphql
BACKEND_REST_URL=https://api.yourdomain.com

# CORS Configuration (Production Frontend URLs)
CORS_ORIGIN=https://yourdomain.com,https://hi.yourdomain.com,https://kn.yourdomain.com

# GraphQL Configuration
GRAPHQL_PLAYGROUND=false
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COST=15000
GRAPHQL_INTROSPECTION=false

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Keycloak Configuration
KEYCLOAK_ISSUER=https://your-keycloak-domain.com/realms/ssbhakthi
KEYCLOAK_JWKS_URL=https://your-keycloak-domain.com/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app
```

### Frontend (.env.local)

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# Backend API URLs
NEXT_PUBLIC_BACKEND_GRAPHQL_URL=https://api.yourdomain.com/graphql
NEXT_PUBLIC_BACKEND_REST_URL=https://api.yourdomain.com

# Keycloak Configuration
KEYCLOAK_ISSUER=https://your-keycloak-domain.com/realms/ssbhakthi
KEYCLOAK_CLIENT_ID=frontend-app
KEYCLOAK_CLIENT_SECRET=your-keycloak-client-secret
```

## 🔧 Development Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGODB_URL=mongodb://admin:devpassword123@localhost:27017/ssbhakthi_api?authSource=admin
REDIS_URL=redis://:devpassword123@localhost:6379

# API URLs (Development)
BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
BACKEND_REST_URL=http://localhost:4000

# CORS Configuration (Development Frontend URLs)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002

# GraphQL Configuration
GRAPHQL_PLAYGROUND=true
GRAPHQL_MAX_DEPTH=8
GRAPHQL_MAX_COST=15000
GRAPHQL_INTROSPECTION=true

# Security
JWT_SECRET=dev-jwt-secret-not-for-production
JWT_EXPIRES_IN=7d

# Keycloak Configuration
KEYCLOAK_ISSUER=http://localhost:8080/realms/ssbhakthi
KEYCLOAK_JWKS_URL=http://localhost:8080/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=admin-app
```

### Frontend (.env.local)

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-nextauth-secret-not-for-production

# Backend API URLs
NEXT_PUBLIC_BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_REST_URL=http://localhost:4000

# Keycloak Configuration
KEYCLOAK_ISSUER=http://localhost:8080/realms/ssbhakthi
KEYCLOAK_CLIENT_ID=frontend-app
KEYCLOAK_CLIENT_SECRET=dev-client-secret
```

## 🌐 Production Deployment Checklist

### 1. Environment Variables

- [ ] Update all API URLs to production domains
- [ ] Set secure MongoDB and Redis connection strings
- [ ] Configure production CORS origins
- [ ] Disable GraphQL playground and introspection
- [ ] Set strong JWT secrets

### 2. Security Configuration

- [ ] Use HTTPS for all API endpoints
- [ ] Configure secure headers
- [ ] Set up proper SSL certificates
- [ ] Configure firewall rules

### 3. Database Configuration

- [ ] Set up production MongoDB cluster
- [ ] Configure database backups
- [ ] Set up Redis for caching
- [ ] Run database migrations

### 4. Domain Configuration

- [ ] Configure DNS records
- [ ] Set up load balancers
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging

## 🚨 Critical Production Issues Fixed

1. **Hardcoded localhost URLs**: Replaced with environment variables
2. **CORS Configuration**: Now supports environment-based configuration
3. **API Endpoint Configuration**: Centralized through environment variables

## 📝 Notes

- All hardcoded `http://localhost:4000` URLs have been replaced with environment variables
- CORS origins can now be configured via `CORS_ORIGIN` environment variable
- Frontend API calls now use `NEXT_PUBLIC_BACKEND_REST_URL` environment variable
- Both development and production configurations are supported
