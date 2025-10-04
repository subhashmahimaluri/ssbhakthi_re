import { config } from 'dotenv';
import { AppConfig } from '../types/config';

// Load environment variables
config();

export const appConfig: AppConfig = {
  port: parseInt(process.env['PORT'] || '4000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  mongoUrl: process.env['MONGODB_URL'] || 'mongodb://localhost:27017/ssbhakthi_api',
  redisUrl: process.env['REDIS_URL'] || 'redis://localhost:6379',
  cors: {
    origin: process.env['CORS_ORIGIN']
      ? process.env['CORS_ORIGIN'].split(',')
      : [
          'http://localhost:3000', // Telugu/English frontend
          'http://localhost:3001', // Hindi frontend
          'http://localhost:3002', // Kannada frontend
          // Add production URLs when available
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  },
  graphql: {
    playground: process.env['GRAPHQL_PLAYGROUND'] === 'true',
    maxDepth: parseInt(process.env['GRAPHQL_MAX_DEPTH'] || '8', 10),
    maxCost: parseInt(process.env['GRAPHQL_MAX_COST'] || '15000', 10),
    introspection: process.env['GRAPHQL_INTROSPECTION'] === 'true',
  },
  keycloak: {
    issuer: process.env['KEYCLOAK_ISSUER'] || '',
    jwksUrl: process.env['KEYCLOAK_JWKS_URL'] || '',
    audience: process.env['KEYCLOAK_AUDIENCE'] || '',
  },
};

export const isProduction = (): boolean => appConfig.nodeEnv === 'production';
export const isDevelopment = (): boolean => appConfig.nodeEnv === 'development';
