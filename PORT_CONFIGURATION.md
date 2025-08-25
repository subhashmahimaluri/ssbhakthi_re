# Port Configuration Summary

## ✅ Resolved Port Conflict

**Issue**: Hindi frontend and Backend API were both using port 3001, causing conflicts.

**Solution**: Moved Backend API from port 3001 to port 4000.

## 🌐 Current Port Mapping

### Frontend Applications

| Language        | URL                      | Port | Description            |
| --------------- | ------------------------ | ---- | ---------------------- |
| Telugu (తెలుగు) | http://localhost:3000    | 3000 | Multi-locale instance  |
| English         | http://localhost:3000/en | 3000 | Same as Telugu         |
| Hindi (हिंदी)   | http://localhost:3001    | 3001 | Single-locale instance |
| Kannada (ಕನ್ನಡ) | http://localhost:3002    | 3002 | Single-locale instance |

### Backend API

| Service      | URL                               | Port | Description       |
| ------------ | --------------------------------- | ---- | ----------------- |
| GraphQL API  | http://localhost:4000/graphql     | 4000 | Apollo Server     |
| REST API     | http://localhost:4000/rest        | 4000 | Express endpoints |
| Health Check | http://localhost:4000/rest/health | 4000 | Health monitoring |

### Docker Services

| Service  | Port  | Admin UI                    | Credentials |
| -------- | ----- | --------------------------- | ----------- |
| MongoDB  | 27017 | http://localhost:8082       | admin/admin |
| Redis    | 6379  | http://localhost:8081       | admin/admin |
| Keycloak | 8080  | http://localhost:8080/admin | admin/admin |

## 🔧 Configuration Changes Made

### 1. Root Package.json

- Updated port checking to include 4000
- Updated kill-ports to include 4000
- No conflicts in concurrent development scripts

### 2. Backend Configuration

- Updated `backend/src/config/app.ts` default port from 3001 → 4000
- Updated all README documentation
- Updated example configurations

### 3. Environment Configuration

- Updated `.env.example` with new backend URLs
- Updated all documentation to reflect port 4000

### 4. Documentation Updates

- Main README.md
- Backend README.md
- Frontend README.md
- Development script (dev.sh)

## 🚀 How to Use

### Start All Services

```bash
pnpm run dev
# or
./dev.sh dev
```

**✨ Now includes Keycloak automatically!**

### Access Applications

- **Telugu**: http://localhost:3000
- **English**: http://localhost:3000/en
- **Hindi**: http://localhost:3001
- **Kannada**: http://localhost:3002
- **Backend GraphQL**: http://localhost:4000/graphql
- **Keycloak Admin**: http://localhost:8080/admin

### Check Service Status

```bash
pnpm run check-ports
# or
./dev.sh status
```

## ✅ Benefits

1. **No Port Conflicts**: Each service has its own dedicated port
2. **Clear Separation**: Frontend and backend are distinctly separated
3. **Scalable**: Easy to add more language instances or backend services
4. **Maintainable**: Clear documentation and configuration

## 📝 Environment Variables

Update your `.env` file with:

```env
# Backend API
BACKEND_PORT=4000
BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
BACKEND_REST_URL=http://localhost:4000

# Frontend
NEXT_PUBLIC_BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_REST_URL=http://localhost:4000

# Frontend Ports (for reference)
FRONTEND_TE_PORT=3000  # Telugu/English
FRONTEND_HI_PORT=3001  # Hindi
FRONTEND_KN_PORT=3002  # Kannada
```

This configuration ensures clean separation between all services while maintaining the multilingual frontend architecture.
