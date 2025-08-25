# Multilingual Next.js App with Multi-Instance Architecture

A powerful multilingual Next.js application supporting **Telugu**, **English**, **Hindi**, and **Kannada** languages with dedicated domains/ports for each language instance.

## 🌍 Live Demo URLs

- **Telugu (Default)**: [http://localhost:3000](http://localhost:3000)
- **English**: [http://localhost:3000/en](http://localhost:3000/en)
- **Hindi**: [http://localhost:3001](http://localhost:3001)
- **Kannada**: [http://localhost:3002](http://localhost:3002)

## ✨ Features

- 🌐 **Multi-Instance Architecture**: Each language runs on dedicated ports
- 🔄 **Smart Language Switching**: Seamless cross-domain navigation
- 📱 **Responsive Design**: React Bootstrap components
- 🎨 **Font Optimization**: Proper rendering for all Indian languages
- ⚡ **TypeScript**: Full type safety and IntelliSense
- 🚀 **SEO Optimized**: Proper meta tags and static generation
- 🛠️ **Developer Friendly**: Hot reload, process management tools
- 📦 **Production Ready**: Build and deployment scripts
- 🔐 **Admin Panel**: Keycloak-secured admin area with RBAC
- ✍️ **Content Management**: Rich text editor with image uploads
- 📊 **GraphQL Integration**: Backend API integration with bearer tokens

## 🏗️ Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React Bootstrap 2.x
- **Styling**: CSS + Bootstrap
- **Internationalization**: Next.js built-in i18n
- **Process Management**: Concurrently + Cross-env
- **Authentication**: NextAuth.js + Keycloak
- **GraphQL Client**: Apollo Client
- **Editor**: CKEditor 5
- **Authorization**: Role-based access control (RBAC)

## 📁 Project Structure

```
multilingual-nextjs-app/
├── 📂 components/
│   └── 📂 Layout/
│       ├── Header.tsx              # Navigation with language switcher
│       ├── Footer.tsx              # Footer component
│       └── Layout.tsx              # Main layout wrapper
├── 📂 hooks/
│   └── useTranslation.ts           # Multi-instance translation hook
├── 📂 locales/
│   ├── index.ts                    # Language exports
│   ├── te.ts                       # Telugu translations
│   ├── en.ts                       # English translations
│   ├── hi.ts                       # Hindi translations
│   └── kn.ts                       # Kannada translations
├── 📂 pages/
│   ├── _app.tsx                    # App wrapper
│   ├── index.tsx                   # Home page
│   ├── about.tsx                   # About page
│   └── contact.tsx                 # Contact page
├── 📂 scripts/
│   ├── start-all.sh                # Start all instances
│   ├── stop-all.sh                 # Stop all instances
│   ├── build-all.sh                # Build all instances
│   └── check-instances.sh          # Status checker
├── 📂 styles/
│   └── globals.css                 # Global styles + font support
├── 📄 .env.te                      # Telugu instance config
├── 📄 .env.hi                      # Hindi instance config
├── 📄 .env.kn                      # Kannada instance config
├── 📄 next.config.js               # Next.js configuration
├── 📄 tsconfig.json                # TypeScript configuration
└── 📄 package.json                 # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### 1. Clone & Install

```bash
# Clone the repository
git clone <your-repository-url>
cd multilingual-nextjs-app

# Install dependencies
npm install

# Install additional dependencies for multi-instance support
npm install cross-env concurrently
```

### 2. Create Environment Files

Create these files in your project root:

**`.env.te`** (Telugu/English instance):

```env
DEFAULT_LOCALE=te
SUPPORTED_LOCALES=te,en
PORT=3000
INSTANCE_TYPE=te-en
```

**`.env.hi`** (Hindi instance):

```env
DEFAULT_LOCALE=hi
SUPPORTED_LOCALES=hi
PORT=3001
INSTANCE_TYPE=hi
```

**`.env.kn`** (Kannada instance):

```env
DEFAULT_LOCALE=kn
SUPPORTED_LOCALES=kn
PORT=3002
INSTANCE_TYPE=kn
```

### 3. Create Required Directories

```bash
mkdir -p scripts .pids
```

### 4. Make Scripts Executable (Linux/Mac)

```bash
chmod +x scripts/*.sh
```

### 5. Start Development

Choose one of these options:

#### Option A: All Instances at Once

```bash
npm run dev:all
```

#### Option B: Individual Instances

```bash
# Terminal 1 - Telugu/English
npm run dev:te

# Terminal 2 - Hindi
npm run dev:hi

# Terminal 3 - Kannada
npm run dev:kn
```

#### Option C: Using Management Scripts (Linux/Mac)

```bash
# Start all instances
./scripts/start-all.sh

# Check status
./scripts/check-instances.sh

# Stop all instances
./scripts/stop-all.sh
```

### 6. Open Your Browser

Visit these URLs to test:

- Telugu: http://localhost:3000
- English: http://localhost:3000/en
- Hindi: http://localhost:3001
- Kannada: http://localhost:3002

## 📝 Available Scripts

### Development Scripts

```bash
npm run dev:te          # Telugu/English instance (port 3000)
npm run dev:hi          # Hindi instance (port 3001)
npm run dev:kn          # Kannada instance (port 3002)
npm run dev:all         # All instances simultaneously
```

### Build Scripts

```bash
npm run build:te        # Build Telugu/English
npm run build:hi        # Build Hindi
npm run build:kn        # Build Kannada
npm run build:all       # Build all instances
```

### Production Scripts

```bash
npm run start:te        # Start Telugu/English (port 3000)
npm run start:hi        # Start Hindi (port 3001)
npm run start:kn        # Start Kannada (port 3002)
npm run start:all       # Start all instances
```

### Management Scripts (Linux/Mac)

```bash
./scripts/start-all.sh      # Start all with process tracking
./scripts/stop-all.sh       # Stop all instances
./scripts/check-instances.sh # Check which instances are running
./scripts/build-all.sh      # Build all instances
```

## 🔧 Configuration

### Language Domain Mapping

The application uses this domain structure:

| Language        | Domain            | Port | Instance Type        |
| --------------- | ----------------- | ---- | -------------------- |
| Telugu (తెలుగు) | localhost:3000    | 3000 | Multi-locale (te,en) |
| English         | localhost:3000/en | 3000 | Same as Telugu       |
| Hindi (हिंदी)   | localhost:3001    | 3001 | Single-locale (hi)   |
| Kannada (ಕನ್ನಡ) | localhost:3002    | 3002 | Single-locale (kn)   |

### Environment Variables

Each instance uses specific environment variables:

- `DEFAULT_LOCALE`: Primary language for the instance
- `SUPPORTED_LOCALES`: Comma-separated list of supported locales
- `PORT`: Port number for the instance
- `INSTANCE_TYPE`: Instance identifier

### Font Support

The application includes optimized font rendering:

```css
/* Telugu */
[lang='te'] {
  font-family: 'Noto Sans Telugu', 'Gautami', 'Raavi', sans-serif;
}

/* Hindi */
[lang='hi'] {
  font-family: 'Noto Sans Devanagari', 'Mangal', 'Kokila', sans-serif;
}

/* Kannada */
[lang='kn'] {
  font-family: 'Noto Sans Kannada', 'Tunga', 'Kedage', sans-serif;
}
```

## 🎨 Usage

### Adding Translations

1. **Add to language files** (`locales/*.ts`):

```typescript
// locales/te.ts
export const te = {
  newSection: {
    title: 'కొత్త విభాగం',
    description: 'వివరణ',
  },
};
```

2. **Use in components**:

```typescript
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t.newSection.title}</h1>;
};
```

### Language Switching

The language switcher automatically handles:

- **Same-instance switching** (Telugu ↔ English): Uses Next.js routing
- **Cross-instance switching** (Hindi/Kannada): Redirects to different ports
- **Context preservation**: Maintains current page and query parameters

### Creating New Pages

1. Create page in `pages/` directory
2. Add translations to all language files
3. The page will be automatically available in all instances

## 🚀 Production Deployment

### Option 1: Separate Servers

Deploy each language instance on separate servers:

```bash
# Server 1 (Telugu/English)
DEFAULT_LOCALE=te SUPPORTED_LOCALES=te,en npm run build:te
DEFAULT_LOCALE=te SUPPORTED_LOCALES=te,en npm run start:te

# Server 2 (Hindi)
DEFAULT_LOCALE=hi SUPPORTED_LOCALES=hi npm run build:hi
DEFAULT_LOCALE=hi SUPPORTED_LOCALES=hi npm run start:hi

# Server 3 (Kannada)
DEFAULT_LOCALE=kn SUPPORTED_LOCALES=kn npm run build:kn
DEFAULT_LOCALE=kn SUPPORTED_LOCALES=kn npm run start:kn
```

### Option 2: Single Server with Reverse Proxy

Use nginx to route different domains:

```nginx
# Telugu/English
server {
    server_name te.yoursite.com yoursite.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}

# Hindi
server {
    server_name hi.yoursite.com;
    location / {
        proxy_pass http://localhost:3001;
    }
}

# Kannada
server {
    server_name kn.yoursite.com;
    location / {
        proxy_pass http://localhost:3002;
    }
}
```

### Option 3: Docker Deployment

Each instance can be containerized separately for scalable deployment.

## 🛠️ Development Workflow

### Adding a New Language

1. **Create language file**: `locales/[code].ts`
2. **Add to index**: Update `locales/index.ts`
3. **Create environment file**: `.env.[code]`
4. **Update package.json**: Add dev/build/start scripts
5. **Update language switcher**: Add to Header component
6. **Update domain mapping**: Modify `useTranslation` hook

### Testing

1. **Start all instances**: `npm run dev:all`
2. **Test each URL**: Verify all languages load correctly
3. **Test language switching**: Ensure cross-domain navigation works
4. **Test responsive design**: Check mobile/tablet layouts
5. **Test form submissions**: Verify functionality in all languages

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill processes on all ports
lsof -ti:3000,3001,3002 | xargs kill -9

# Or individually
npx kill-port 3000
npx kill-port 3001
npx kill-port 3002
```

#### Environment Variables Not Loading

- Restart all Next.js instances after changing `.env` files
- Verify environment file names match exactly (`.env.te`, `.env.hi`, `.env.kn`)

#### Cross-Domain Switching Not Working

- Ensure all instances are running
- Check `LANGUAGE_DOMAINS` mapping in `hooks/useTranslation.ts`
- Verify ports match environment configuration

#### Font Rendering Issues

Install system fonts for better rendering:

- **Telugu**: Noto Sans Telugu
- **Hindi**: Noto Sans Devanagari
- **Kannada**: Noto Sans Kannada

#### Build Errors

```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build:all
```

### Performance Optimization

1. **Development**: Run only needed instances to save system resources
2. **Production**: Use PM2 or similar process managers
3. **Caching**: Implement Redis/Memcached for better performance
4. **CDN**: Use CDN for static assets across all domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Add translations for all supported languages
4. Test on all instances
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

### Translation Guidelines

- Keep translations contextually accurate
- Maintain consistent terminology across pages
- Test font rendering for Indian languages
- Verify right-to-left text handling if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for excellent i18n support
- React Bootstrap for responsive components
- Font contributors for Indian language fonts
- Community translators for language support

## 📞 Support

If you encounter any issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub issues](../../issues)
3. Create a new issue with:
   - Operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

## 🔐 Admin Panel

The application includes a secure admin panel for content management with Keycloak authentication and role-based access control.

### Admin Features

- **Keycloak Authentication**: Secure OIDC-based authentication
- **Role-Based Access Control**: Admin, Editor, Author roles
- **Article Management**: CRUD operations with rich text editing
- **Media Management**: File upload and organization
- **Multi-language Support**: Content management for all locales
- **GraphQL Integration**: Real-time backend communication
- **CKEditor 5**: Rich text editing with image uploads
- **ISR Revalidation**: Webhook-based cache invalidation

### Admin Setup

#### 1. Environment Configuration

Create a `.env.local` file with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Keycloak Configuration
KEYCLOAK_ISSUER=https://your-keycloak-domain.com/realms/ssbhakthi
KEYCLOAK_CLIENT_ID=admin-app
KEYCLOAK_CLIENT_SECRET=your_keycloak_client_secret

# Backend API Configuration
BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
BACKEND_REST_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_REST_URL=http://localhost:4000

# Revalidation Secret
REVALIDATE_SECRET=your_revalidation_secret_here
```

#### 2. Keycloak Setup

**Realm Configuration:**

1. Create a new realm named `ssbhakthi`
2. Configure realm settings:
   - Login theme: Choose appropriate theme
   - Token settings: Set appropriate expiration times
   - Required actions: Configure as needed

**Client Configuration:**

1. Create a new client with ID `admin-app`
2. Client settings:
   ```
   Client ID: admin-app
   Client Protocol: openid-connect
   Access Type: confidential
   Standard Flow Enabled: ON
   Direct Access Grants Enabled: ON
   Valid Redirect URIs: http://localhost:3000/api/auth/callback/keycloak
   Web Origins: http://localhost:3000
   ```
3. Go to Credentials tab and copy the client secret

**User Roles:**

Create the following realm roles:

- `admin`: Full access to all admin features
- `editor`: Can manage content and media
- `author`: Can create and edit own content

**User Setup:**

1. Create users in Keycloak
2. Assign appropriate roles to users
3. Set user passwords and ensure accounts are enabled

#### 3. Backend Integration

Ensure your backend GraphQL server is running on `http://localhost:4000/graphql` with the following features:

**Required GraphQL Queries:**

```graphql
type Query {
  articles(
    locale: String
    status: String
    search: String
    limit: Int
    offset: Int
    sort: String
  ): [Article!]!
  article(id: ID!): Article
  categories: [Category!]!
  tags: [Tag!]!
}

type Mutation {
  createArticle(input: CreateArticleInput!): Article!
  updateArticle(id: ID!, input: UpdateArticleInput!): Article!
  deleteArticle(id: ID!): Boolean!
}
```

**Required REST Endpoints:**

```
POST /rest/media/upload
- Accepts multipart/form-data with 'file' field
- Returns: { "id": "file-id", "url": "file-url" }
- Requires Authorization: Bearer <token>
```

**Authentication:**

- Backend must validate JWT tokens from Keycloak
- Extract user roles from token `realm_access.roles`
- Implement proper authorization for admin endpoints

### Admin Usage

#### Accessing the Admin Panel

1. **Sign In**: Click "Sign In" in the top bar
2. **Keycloak Authentication**: Redirected to Keycloak login
3. **Role Verification**: System checks for admin/editor/author roles
4. **Dashboard Access**: Redirected to `/admin` after successful authentication

#### Admin Navigation

The admin panel includes:

- **Dashboard**: Overview and quick access
- **Articles**: Content management with filtering and search
- **Media**: File upload and organization (placeholder)
- **Panchangam**: Calendar data management (placeholder)
- **Users**: User management (admin only)

#### Article Management

**Creating Articles:**

1. Navigate to Articles → New Article
2. Select target language (Telugu, English, Hindi, Kannada)
3. Fill in article details:
   - Title (auto-generates slug)
   - Summary
   - Content (using CKEditor)
   - SEO settings
   - Categories and tags
4. Set status: Draft, Published, Scheduled
5. Save or publish

**Content Editor Features:**

- **Rich Text Editing**: Full CKEditor 5 functionality
- **Image Upload**: Drag & drop or click to upload
- **Multi-language Support**: Switch between locales
- **Auto-save**: Periodic content saving
- **SEO Optimization**: Meta titles, descriptions, keywords

**Article List Features:**

- **Filtering**: By locale, status, author
- **Search**: Full-text search across titles and content
- **Sorting**: By date, title, status
- **Pagination**: Efficient content browsing
- **Bulk Actions**: Future enhancement

#### Role-Based Features

**Admin Role:**

- Full access to all features
- User management
- System settings
- All content operations

**Editor Role:**

- Content management
- Media management
- Published content moderation
- Limited user operations

**Author Role:**

- Create and edit own content
- Basic media upload
- Draft management

#### ISR Revalidation

The admin panel can trigger Incremental Static Regeneration:

**Webhook Endpoint:**

```
POST /api/revalidate
Headers:
  Authorization: Bearer <REVALIDATE_SECRET>
Body:
  {
    "paths": ["/", "/articles", "/articles/[slug]"]
  }
```

**Usage:**

- Automatically triggered after content publishing
- Manual trigger from admin interface
- Webhook integration with backend CMS

### Development with Admin Panel

#### Local Development

1. **Start Backend**: Ensure GraphQL server is running
2. **Start Frontend**: Use any instance (admin works on all)
3. **Configure Keycloak**: Set up local Keycloak or use remote instance
4. **Test Authentication**: Verify login flow works
5. **Test API Integration**: Check GraphQL queries work

#### Testing Admin Features

```bash
# Start development server
npm run dev:te

# Test admin access
# 1. Visit http://localhost:3000/admin
# 2. Should redirect to sign-in
# 3. After Keycloak login, should show admin dashboard
# 4. Test article creation with image upload
# 5. Verify role-based access (try /admin/users with non-admin user)
```

#### Debugging

**Common Issues:**

1. **Keycloak Connection Errors**:
   - Verify KEYCLOAK_ISSUER URL
   - Check client configuration
   - Ensure network connectivity

2. **GraphQL Errors**:
   - Check backend server status
   - Verify bearer token in requests
   - Check CORS configuration

3. **File Upload Issues**:
   - Verify backend upload endpoint
   - Check file size limits
   - Ensure proper MIME type handling

4. **Role Access Issues**:
   - Verify user has correct roles in Keycloak
   - Check JWT token contains realm_access.roles
   - Verify middleware role checking logic

**Debug Tools:**

- Browser DevTools Network tab for API calls
- NextAuth debug mode: `NEXTAUTH_DEBUG=true`
- Apollo Client DevTools for GraphQL debugging
- Keycloak admin console for user/role management

### Production Deployment

#### Security Considerations

1. **Environment Variables**: Never commit secrets to repository
2. **HTTPS**: Use SSL for all authentication flows
3. **Token Security**: Implement proper token refresh logic
4. **Rate Limiting**: Add rate limiting to admin APIs
5. **Audit Logging**: Log all admin actions for security

#### Deployment Checklist

- [ ] Keycloak properly configured for production domain
- [ ] Environment variables set in production
- [ ] Backend GraphQL server deployed and accessible
- [ ] SSL certificates configured
- [ ] Database migrations completed
- [ ] Admin user accounts created
- [ ] Backup procedures established
- [ ] Monitoring and logging configured

### API Reference

#### Authentication Endpoints

```
GET  /api/auth/signin          # Sign in page
POST /api/auth/callback/keycloak # OAuth callback
POST /api/auth/signout         # Sign out
GET  /api/auth/session         # Current session
```

#### Admin Endpoints

```
GET  /admin                    # Dashboard
GET  /admin/articles           # Article list
GET  /admin/articles/new       # New article form
GET  /admin/articles/[id]      # Edit article
GET  /admin/media              # Media library
GET  /admin/users              # User management (admin only)
```

#### Revalidation API

```
POST /api/revalidate
# Headers: Authorization: Bearer <REVALIDATE_SECRET>
# Body: { "paths": ["path1", "path2"] }
# Response: { "message": "success", "results": [...] }
```

---

## 🔗 Useful Links

- [Next.js i18n Documentation](https://nextjs.org/docs/advanced-features/i18n)
- [React Bootstrap Documentation](https://react-bootstrap.github.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Happy multilingual development! 🌍🚀**

Made with ❤️ for the multilingual web community.
