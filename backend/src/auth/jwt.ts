import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Define AuthUser type for reuse
export interface AuthUser {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
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

      const authHeader = req.headers.authorization;

      // If we have a real JWT token, try to extract user data from it
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        if (token && token !== 'dev-token-for-testing') {
          try {
            // Decode JWT token without verification to get user data
            const decoded = jwt.decode(token) as any;

            if (decoded && decoded.email) {
              console.log('📝 Extracting real user data from JWT token');
              console.log('👤 Real user data found:', {
                email: decoded.email,
                name: decoded.name,
                preferred_username: decoded.preferred_username,
                given_name: decoded.given_name,
                family_name: decoded.family_name,
              });

              // Extract the best available name for display (prioritize full name)
              const displayName =
                decoded.name ||
                decoded.preferred_username ||
                (decoded.given_name && decoded.family_name
                  ? `${decoded.given_name} ${decoded.family_name}`
                  : null) ||
                decoded.given_name ||
                decoded.email?.split('@')[0] ||
                'Anonymous User';

              // Generate a consistent user ID based on email to enable edit/delete
              const userId =
                decoded.sub || `user-${decoded.email?.replace(/[@.]/g, '-')}` || 'dev-user-123';

              req.user = {
                sub: userId,
                email: decoded.email,
                preferred_username: displayName, // This will be used as userName in comments
                name: decoded.name,
                given_name: decoded.given_name,
                family_name: decoded.family_name,
                roles: decoded.realm_access?.roles || ['user'],
              };

              console.log('✅ Using real user data:', {
                email: req.user.email,
                displayName: displayName,
                userId: userId,
              });
              next();
              return;
            }
          } catch (decodeError) {
            console.log('⚠️  Could not decode JWT token, using fallback');
          }
        }
      }

      // Fallback to hardcoded development user
      console.log('📝 Using hardcoded development user');
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
