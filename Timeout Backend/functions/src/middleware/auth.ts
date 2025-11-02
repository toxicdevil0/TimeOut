/**
 * Authentication Middleware for Firebase Cloud Functions
 * Provides real JWT verification and role-based access control
 */

import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { backendEnvConfig } from '../config/environment';
import { admin, db } from '../config/firebase';
import { securityMonitor, SecurityEventType, SecuritySeverity } from '../utils/securityMonitor';

export interface AuthenticatedUser {
  id: string;
  clerkUserId: string;
  role: string;
  email?: string;
  lastActive?: Date;
}

export interface AuthenticatedRequest extends CallableRequest {
  user?: AuthenticatedUser;
}

/**
 * Authentication middleware class
 */
export class AuthMiddleware {
  
  /**
   * Verify Clerk JWT token and extract user information
   */
  static async verifyClerkToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Import Clerk backend for JWT verification
      const { verifyToken } = await import('@clerk/backend');
      
      const secretKey = backendEnvConfig.getClerkSecretKey();
      
      if (!secretKey) {
        throw new Error('CLERK_SECRET_KEY not configured');
      }

      // Handle development with placeholder keys
      if (backendEnvConfig.isDev() && secretKey.includes('placeholder')) {
        return await this.validateTokenForDevelopment(token);
      }

      // Production Clerk verification
      try {
        const payload = await verifyToken(token, {
          secretKey: secretKey,
        });
        
        const user: AuthenticatedUser = {
          id: payload.sub as string,
          clerkUserId: payload.sub as string,
          role: 'student', // Will be updated from Firestore
          email: payload.email as string | undefined,
        };
        
        // Get user role from Firestore
        await this.enrichUserWithFirestoreData(user);
        
        return user;
        
      } catch (error) {
        console.error('Clerk token verification failed:', error);
        
        // Log authentication failure as security event
        await securityMonitor.logSecurityEvent({
          type: SecurityEventType.AUTH_FAILURE,
          severity: SecuritySeverity.WARNING,
          message: `Clerk token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            tokenPresent: true,
            verificationMethod: 'clerk'
          }
        });
        
        return null;
      }

    } catch (error) {
      console.error('Critical error in token verification:', error);
      return null;
    }
  }

  /**
   * Development token validation (when using placeholder keys)
   */
  private static async validateTokenForDevelopment(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Basic JWT structure validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      
      if (!payload.sub || !payload.iat || !payload.exp) {
        return null;
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }
      
      const user: AuthenticatedUser = {
        id: payload.sub,
        clerkUserId: payload.sub,
        role: 'student',
        email: payload.email || `${payload.sub}@example.com`,
      };
      
      // Get real user data from Firestore if available
      await this.enrichUserWithFirestoreData(user);
      
      return user;
      
    } catch (error) {
      console.error('Development token validation failed:', error);
      
      // Log authentication failure
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: SecuritySeverity.WARNING,
        message: `Development token validation failed: ${error instanceof Error ? error.message : 'Invalid token format'}`,
        metadata: { 
          error: error instanceof Error ? error.message : 'Invalid token format',
          tokenPresent: true,
          verificationMethod: 'development'
        }
      });
      
      return null;
    }
  }

  /**
   * Enrich user object with data from Firestore
   */
  private static async enrichUserWithFirestoreData(user: AuthenticatedUser): Promise<void> {
    try {
      const userDoc = await db.collection('users').doc(user.clerkUserId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data()!;
        user.role = userData.role || 'student';
        user.lastActive = userData.lastActive?.toDate();
        
        // Update last active timestamp
        await userDoc.ref.update({
          lastActive: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create user document if it doesn't exist
        await this.createUserDocument(user);
      }
    } catch (error) {
      console.error('Failed to enrich user with Firestore data:', error);
      // Continue with basic user info
    }
  }

  /**
   * Create user document in Firestore
   */
  private static async createUserDocument(user: AuthenticatedUser): Promise<void> {
    try {
      await db.collection('users').doc(user.clerkUserId).set({
        clerkUserId: user.clerkUserId,
        email: user.email,
        role: user.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        preferences: {
          notifications: true,
          theme: 'system'
        },
        stats: {
          totalStudyTime: 0,
          sessionsCompleted: 0,
          tokensEarned: 0
        }
      });
      
      console.log(`✅ Created user document for ${user.clerkUserId}`);
    } catch (error) {
      console.error('Failed to create user document:', error);
    }
  }

  /**
   * Require authentication for callable function
   */
  static async requireAuth(request: CallableRequest): Promise<AuthenticatedUser> {
    const token = request.rawRequest.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Log missing token as security event
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.AUTH_FAILURE,
        severity: SecuritySeverity.WARNING,
        message: 'Authentication attempted without token',
        metadata: { 
          reason: 'missing_token',
          endpoint: 'protected_function'
        }
      });
      
      throw new HttpsError('unauthenticated', 'No authorization token provided');
    }

    const user = await this.verifyClerkToken(token);
    
    if (!user) {
      // Log invalid token as security event
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.TOKEN_INVALID,
        severity: SecuritySeverity.ERROR,
        message: 'Authentication failed with invalid or expired token',
        metadata: { 
          reason: 'token_validation_failed',
          tokenPresent: true
        }
      });
      
      throw new HttpsError('unauthenticated', 'Invalid or expired token');
    }

    return user;
  }

  /**
   * Require specific role for access
   */
  static async requireRole(request: CallableRequest, requiredRole: string): Promise<AuthenticatedUser> {
    const user = await this.requireAuth(request);
    
    // Admin role can access everything
    if (user.role === 'admin') {
      return user;
    }
    
    // Check specific role requirement
    if (user.role !== requiredRole) {
      // Log unauthorized access attempt
      await securityMonitor.logSecurityEvent({
        type: SecurityEventType.ACCESS_DENIED,
        severity: SecuritySeverity.WARNING,
        userId: user.id,
        message: `Access denied: User role '${user.role}' insufficient for required role '${requiredRole}'`,
        metadata: { 
          requiredRole,
          userRole: user.role,
          userId: user.id
        }
      });
      
      throw new HttpsError(
        'permission-denied', 
        `Access denied. Required role: ${requiredRole}, user role: ${user.role}`
      );
    }

    return user;
  }

  /**
   * Require admin access
   */
  static async requireAdmin(request: CallableRequest): Promise<AuthenticatedUser> {
    return await this.requireRole(request, 'admin');
  }

  /**
   * Optional authentication (user can be null)
   */
  static async optionalAuth(request: CallableRequest): Promise<AuthenticatedUser | null> {
    const token = request.rawRequest.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    return await this.verifyClerkToken(token);
  }
}

/**
 * Helper functions for common authentication patterns
 */

export const requireAuth = (request: CallableRequest) => AuthMiddleware.requireAuth(request);
export const requireRole = (request: CallableRequest, role: string) => AuthMiddleware.requireRole(request, role);
export const requireAdmin = (request: CallableRequest) => AuthMiddleware.requireAdmin(request);
export const optionalAuth = (request: CallableRequest) => AuthMiddleware.optionalAuth(request);