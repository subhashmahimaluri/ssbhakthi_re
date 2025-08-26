import express, { Application } from 'express';
import { requireAuth, requireRole } from './auth/jwt';
import { appConfig } from './config/app';
import { connectDB } from './config/database';
import { apolloServer, createGraphQLMiddleware } from './graphql/server';
import { errorHandler, notFoundHandler } from './middleware/error';
import healthRoutes from './routes/health';
import mediaRoutes from './routes/media';
import stotrasRoutes from './routes/stotras';

class App {
  public app: Application;
  private isInitialized: boolean = false;

  constructor() {
    this.app = express();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    await this.initializeGraphQL();
    this.initializeErrorHandling();
    this.isInitialized = true;
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await connectDB();
    } catch (error) {
      console.error('Failed to connect to database:', error);
    }
  }

  private initializeMiddlewares(): void {
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Security headers
    this.app.use((_req, res, next) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      });
      next();
    });

    // Request logging
    this.app.use((req, _res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        message: 'SSBhakthi API Server',
        version: '1.0.0',
        environment: appConfig.nodeEnv,
        endpoints: {
          rest: {
            health: '/rest/health',
            media: '/rest/media',
            stotras: '/rest/stotras',
          },
          graphql: '/graphql',
        },
      });
    });

    // REST API routes
    this.app.use('/rest/health', healthRoutes);
    this.app.use('/rest/media', mediaRoutes);
    this.app.use('/rest/stotras', stotrasRoutes);

    // Authentication test routes
    this.app.get('/auth/me', requireAuth, (req, res) => {
      res.json({ user: req.user });
    });

    this.app.get('/auth/admin-only', requireAuth, requireRole('admin'), (req, res) => {
      res.json({ message: 'Welcome admin!', user: req.user });
    });
  }

  private async initializeGraphQL(): Promise<void> {
    try {
      // Start Apollo Server
      await apolloServer.start();

      // Mount GraphQL endpoint
      this.app.use('/graphql', createGraphQLMiddleware());

      console.log('🚀 GraphQL server initialized at /graphql');
    } catch (error) {
      console.error('Failed to initialize GraphQL server:', error);
    }
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    // Wait for initialization to complete
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.app.listen(appConfig.port, () => {
      console.log(`🚀 Server running on port ${appConfig.port}`);
      console.log(`📊 Environment: ${appConfig.nodeEnv}`);
      console.log(`🏥 Health check: http://localhost:${appConfig.port}/rest/health`);
      console.log(`🔗 GraphQL endpoint: http://localhost:${appConfig.port}/graphql`);
      if (appConfig.graphql.playground) {
        console.log(
          `🎮 GraphQL Playground available at: http://localhost:${appConfig.port}/graphql`
        );
      }
    });
  }
}

export default App;
