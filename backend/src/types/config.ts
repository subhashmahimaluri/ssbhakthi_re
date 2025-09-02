export interface AppConfig {
  port: number;
  nodeEnv: string;
  mongoUrl: string;
  redisUrl: string;
  // CORS Configuration
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  // GraphQL Configuration
  graphql: {
    playground: boolean;
    maxDepth: number;
    maxCost: number;
    introspection: boolean;
  };
  // Keycloak Configuration
  keycloak: {
    issuer: string;
    jwksUrl: string;
    audience: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}
