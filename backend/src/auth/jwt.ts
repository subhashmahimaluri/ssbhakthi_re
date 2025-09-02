import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Define AuthUser type for reuse
export interface AuthUser {
  sub: string;
  email?: string;
  preferred_username?: string;
  roles: string[];
}

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Initialize JWKS client for Keycloak
const client = jwksClient({
  jwksUri: process.env['KEYCLOAK_JWKS_URL'] || '',
  cache: true,
  rateLimit: true,
});

// Get signing key from JWKS
function getKey(header: any, callback: any): void {
  client.getSigningKey(header.kid, (err: any, key: any) => {
    const signingKey = key?.publicKey || key?.rsaPublicKey;
    callback(err, signingKey);
  });
}

// Express middleware to authenticate requests
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Development bypass for testing
    if (process.env['NODE_ENV'] === 'development' && process.env['BYPASS_AUTH'] === 'true') {
      console.log('⚠️  Auth bypassed for development');
      req.user = {
        sub: 'dev-user-123',
        email: 'user@example.com',
        preferred_username: 'Subhash Ycs', // Use a real-looking name for development
        roles: ['user'],
      };
      next();
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Missing token' });
      return;
    }

    // Verify token using JWKS
    jwt.verify(
      token,
      getKey,
      {
        audience: process.env['KEYCLOAK_AUDIENCE'],
        issuer: process.env['KEYCLOAK_ISSUER'],
        algorithms: ['RS256'],
      },
      (err: any, decoded: any) => {
        if (err) {
          res.status(401).json({ error: 'Unauthorized', details: err.message });
          return;
        }

        // Extract user information from token
        req.user = {
          sub: decoded.sub,
          email: decoded.email,
          preferred_username: decoded.preferred_username,
          roles: decoded.realm_access?.roles || [],
        };

        next();
      }
    );
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// Utility function to check if a user has any of the required roles
export function hasAnyRole(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.some(role => user.roles.includes(role));
}

// Express middleware to check for specific roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!hasAnyRole(req.user, roles)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Missing required roles: ${roles.join(', ')}`,
        userRoles: req.user.roles,
      });
      return;
    }

    next();
  };
}
