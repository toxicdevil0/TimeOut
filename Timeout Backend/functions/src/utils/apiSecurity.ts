/**
 * API Security Middleware System
 * Comprehensive security layer for API endpoints with authentication, authorization, and protection
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { admin } from '../config/firebase';
import { RateLimiter } from './advancedRateLimiter';
import { InputValidation } from './inputValidation';
import logger from './logger';
import { 
  securityMonitor, 
  SecurityEventType, 
  SecuritySeverity
} from './securityMonitor';

export interface SecurityContext {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    permissions?: string[];
    emailVerified?: boolean;
  };
  ip?: string;
  userAgent?: string;
  timestamp: number;
}

export interface AuthorizationRule {
  roles?: string[];
  permissions?: string[];
  requireEmailVerified?: boolean;
  allowSelf?: boolean; // Allow if user is accessing their own data
  customCheck?: (context: SecurityContext, data: any) => boolean;
}

/**
 * API Security Middleware Class
 */
export class APISecurityMiddleware {
  
  /**
   * Authenticate Firebase token and extract user context
   */
  static async authenticateToken(request: any): Promise<SecurityContext> {
    const authHeader = request.rawRequest?.headers?.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpsError('unauthenticated', 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.length < 10) {
      throw new HttpsError('unauthenticated', 'Invalid token format');
    }

    try {
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      
      if (!decodedToken.uid) {
        throw new HttpsError('unauthenticated', 'Invalid token: missing user ID');
      }

      // Get additional user data
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      
      const context: SecurityContext = {
        user: {
          uid: decodedToken.uid,
          email: userRecord.email,
          role: decodedToken.role || userRecord.customClaims?.role || 'user',
          permissions: decodedToken.permissions || userRecord.customClaims?.permissions || [],
          emailVerified: userRecord.emailVerified
        },
        ip: this.extractIP(request) || undefined,
        userAgent: request.rawRequest?.headers?.['user-agent'],
        timestamp: Date.now()
      };

      // Log successful authentication
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.AUTH_SUCCESS,
        severity: SecuritySeverity.INFO,
        userId: context.user?.uid,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        message: 'User authentication successful',
        metadata: {
          role: context.user?.role,
          email: context.user?.email
        }
      });

      logger.info('User authenticated successfully', {
        uid: context.user?.uid,
        email: context.user?.email,
        role: context.user?.role,
        ip: context.ip
      });

      return context;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const ip = this.extractIP(request) || undefined;
      const userAgent = request.rawRequest?.headers?.['user-agent'];

      // Log authentication failure
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: SecuritySeverity.WARNING,
        ipAddress: ip,
        userAgent,
        message: `Authentication failed: ${errorMessage}`,
        metadata: {
          errorType: error instanceof HttpsError ? error.code : 'unknown',
          token: token ? 'provided' : 'missing'
        }
      });

      logger.error('Token verification failed', {
        error: errorMessage,
        ip,
        userAgent
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('unauthenticated', 'Token verification failed');
    }
  }

  /**
   * Check authorization based on rules
   */
  static async authorize(context: SecurityContext, rules: AuthorizationRule, resourceData?: any): Promise<void> {
    const user = context.user;
    
    if (!user) {
      throw new HttpsError('unauthenticated', 'User context required for authorization');
    }

    // Check email verification requirement
    if (rules.requireEmailVerified && !user.emailVerified) {
      logger.warn('Access denied: email not verified', {
        uid: user.uid,
        email: user.email
      });
      throw new HttpsError('permission-denied', 'Email verification required');
    }

    // Check role-based authorization
    if (rules.roles && rules.roles.length > 0) {
      if (!user.role || !rules.roles.includes(user.role)) {
        // Log access denied event
        await securityMonitor.logSecurityEvent({
          type: SecurityEventType.ACCESS_DENIED,
          severity: SecuritySeverity.WARNING,
          userId: user.uid,
          ipAddress: context.ip,
          userAgent: context.userAgent,
          message: `Access denied: insufficient role permissions`,
          metadata: {
            userRole: user.role,
            requiredRoles: rules.roles,
            reason: 'insufficient_role'
          }
        });

        logger.warn('Access denied: insufficient role', {
          uid: user.uid,
          userRole: user.role,
          requiredRoles: rules.roles
        });
        throw new HttpsError('permission-denied', 'Insufficient role permissions');
      }
    }

    // Check permission-based authorization
    if (rules.permissions && rules.permissions.length > 0) {
      const userPermissions = user.permissions || [];
      const hasPermission = rules.permissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        // Log permission denied event
        await securityMonitor.logSecurityEvent({
          type: SecurityEventType.ACCESS_DENIED,
          severity: SecuritySeverity.WARNING,
          userId: user.uid,
          ipAddress: context.ip,
          userAgent: context.userAgent,
          message: `Access denied: missing required permissions`,
          metadata: {
            userPermissions,
            requiredPermissions: rules.permissions,
            reason: 'missing_permissions'
          }
        });

        logger.warn('Access denied: missing permissions', {
          uid: user.uid,
          userPermissions,
          requiredPermissions: rules.permissions
        });
        throw new HttpsError('permission-denied', 'Missing required permissions');
      }
    }

    // Check self-access rule
    if (rules.allowSelf && resourceData) {
      const resourceUserId = resourceData.userId || resourceData.uid || resourceData.ownerId;
      if (resourceUserId === user.uid) {
        // User is accessing their own resource - allow
        return;
      }
    }

    // Custom authorization check
    if (rules.customCheck) {
      const customResult = rules.customCheck(context, resourceData);
      if (!customResult) {
        logger.warn('Access denied: custom check failed', {
          uid: user.uid,
          resourceData: resourceData ? Object.keys(resourceData) : 'none'
        });
        throw new HttpsError('permission-denied', 'Access denied by custom authorization rule');
      }
    }

    logger.info('Authorization successful', {
      uid: user.uid,
      rules: {
        roles: rules.roles,
        permissions: rules.permissions,
        requireEmailVerified: rules.requireEmailVerified,
        allowSelf: rules.allowSelf
      }
    });
  }

  /**
   * Comprehensive security check for API endpoints
   */
  static async secureEndpoint(
    request: any,
    options: {
      requireAuth?: boolean;
      authRules?: AuthorizationRule;
      rateLimitType?: 'auth' | 'api' | 'strict' | 'burst';
      validateInput?: boolean;
      allowedMethods?: string[];
    } = {}
  ): Promise<SecurityContext | null> {
    const {
      requireAuth = true,
      authRules,
      rateLimitType = 'api',
      validateInput = true,
      allowedMethods
    } = options;

    let context: SecurityContext | null = null;

    // Check HTTP method if specified
    if (allowedMethods && allowedMethods.length > 0) {
      const method = request.rawRequest?.method?.toUpperCase();
      if (method && !allowedMethods.includes(method)) {
        throw new HttpsError('invalid-argument', `Method ${method} not allowed`);
      }
    }

    // Apply rate limiting
    try {
      switch (rateLimitType) {
        case 'auth':
          RateLimiter.authLimiter(request);
          break;
        case 'strict':
          RateLimiter.strictLimiter(request);
          break;
        case 'burst':
          RateLimiter.burstLimiter(request);
          break;
        case 'api':
        default:
          RateLimiter.apiLimiter(request);
          break;
      }
    } catch (error) {
      logger.warn('Rate limit exceeded', {
        type: rateLimitType,
        ip: this.extractIP(request) || undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }

    // Authenticate user if required
    if (requireAuth) {
      context = await this.authenticateToken(request);
      
      // Apply authorization rules if provided
      if (authRules) {
        this.authorize(context, authRules, request.data);
      }
    }

    // Validate and sanitize input data
    if (validateInput && request.data) {
      try {
        this.validateRequestData(request.data);
      } catch (error) {
        logger.warn('Input validation failed', {
          uid: context?.user?.uid,
          ip: context?.ip,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    }

    return context;
  }

  /**
   * Validate and sanitize request data
   */
  private static validateRequestData(data: any): void {
    if (typeof data !== 'object' || data === null) {
      return;
    }

    // Recursively validate and sanitize data
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for potentially dangerous strings
        if (value.length > 10000) {
          throw new HttpsError('invalid-argument', `Field '${key}' exceeds maximum length`);
        }

        // Sanitize the string
        data[key] = InputValidation.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects
        this.validateRequestData(value);
      } else if (Array.isArray(value)) {
        // Validate array elements
        if (value.length > 1000) {
          throw new HttpsError('invalid-argument', `Array '${key}' exceeds maximum length`);
        }
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.validateRequestData(item);
          }
        });
      }
    }
  }

  /**
   * Extract client IP address
   */
  public static extractIP(request: any): string | null {
    const headers = request.rawRequest?.headers;
    if (!headers) return null;

    const ipHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip',
      'fastly-client-ip',
      'true-client-ip'
    ];

    for (const header of ipHeaders) {
      const ip = headers[header];
      if (ip) {
        return ip.split(',')[0].trim();
      }
    }

    return request.rawRequest?.connection?.remoteAddress || null;
  }
}

/**
 * Predefined authorization rules for common scenarios
 */
export const AuthRules = {
  // Admin only access
  ADMIN_ONLY: {
    roles: ['admin', 'super_admin'],
    requireEmailVerified: true
  } as AuthorizationRule,

  // Moderator or above
  MODERATOR_OR_ABOVE: {
    roles: ['moderator', 'admin', 'super_admin'],
    requireEmailVerified: true
  } as AuthorizationRule,

  // Verified users only
  VERIFIED_USERS: {
    requireEmailVerified: true
  } as AuthorizationRule,

  // User can access their own data or admin can access any
  SELF_OR_ADMIN: {
    roles: ['admin', 'super_admin'],
    allowSelf: true,
    requireEmailVerified: true
  } as AuthorizationRule,

  // User management operations
  USER_MANAGEMENT: {
    permissions: ['users:read', 'users:write'],
    requireEmailVerified: true
  } as AuthorizationRule,

  // Room management
  ROOM_MANAGEMENT: {
    permissions: ['rooms:create', 'rooms:manage'],
    requireEmailVerified: true
  } as AuthorizationRule
};

/**
 * Secure callable function wrapper
 */
export const secureCallable = (
  handler: (request: any, context: SecurityContext | null) => Promise<any>,
  options: Parameters<typeof APISecurityMiddleware.secureEndpoint>[1] = {}
) => {
  return async (request: any) => {
    try {
      const context = await APISecurityMiddleware.secureEndpoint(request, options);
      return await handler(request, context);
    } catch (error) {
      logger.error('Secure callable function error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        uid: request.auth?.uid,
        ip: APISecurityMiddleware.extractIP(request)
      });
      throw error;
    }
  };
};