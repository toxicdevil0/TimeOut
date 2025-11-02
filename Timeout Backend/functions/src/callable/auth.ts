/**
 * Clerk Firebase Authentication Integration
 * Creates Firebase custom tokens for Clerk authenticated users
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from '../config/firebase';
import { InputValidation } from '../utils/inputValidation';
import { RateLimiter } from '../utils/rateLimiter';
import { AuthMiddleware } from '../middleware/auth';

/**
 * Create Firebase custom token for Clerk user
 * Called from frontend after Clerk authentication
 */
export const createFirebaseToken = onCall(
  {
    cors: process.env.NODE_ENV === 'production' 
      ? ['https://timeout-study-app.vercel.app', 'https://timeout.vercel.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    try {
      // Apply rate limiting for authentication attempts
      RateLimiter.authLimiter(request);
      
      const { clerkUserId } = request.data;

      // Validate and sanitize Clerk user ID
      if (!clerkUserId || typeof clerkUserId !== 'string') {
        throw new HttpsError('invalid-argument', 'Valid Clerk user ID is required');
      }

      const sanitizedUserId = InputValidation.sanitizeString(clerkUserId);
      
      if (!sanitizedUserId || sanitizedUserId.length < 5 || sanitizedUserId.length > 100) {
        throw new HttpsError('invalid-argument', 'Invalid Clerk user ID format');
      }

      // Validate Clerk token using secure middleware
      const clerkToken = request.rawRequest.headers.authorization?.replace('Bearer ', '');
      
      if (!clerkToken) {
        throw new HttpsError('unauthenticated', 'Authorization token required');
      }

      // Use the new secure authentication middleware
      const authenticatedUser = await AuthMiddleware.verifyClerkToken(clerkToken);
      
      if (!authenticatedUser) {
        throw new HttpsError('unauthenticated', 'Invalid or expired Clerk token');
      }

      // Verify the token belongs to the requested user
      if (authenticatedUser.clerkUserId !== sanitizedUserId) {
        throw new HttpsError('unauthenticated', 'Token does not match requested user ID');
      }

      // Ensure user document exists and get user data
      await ensureUserExists(sanitizedUserId);
      
      // Get user role for custom claims
      const userDoc = await admin.firestore().collection('users').doc(sanitizedUserId).get();
      const userData = userDoc.data();
      const userRole = userData?.role || 'student';

      // Create Firebase custom token with Clerk user ID as UID and role claims
      const customToken = await admin.auth().createCustomToken(sanitizedUserId, {
        clerk_user_id: sanitizedUserId,
        provider: 'clerk',
        role: userRole,
        email: userData?.email || null,
        createdAt: userData?.createdAt || null
      });

      return { 
        customToken,
        success: true 
      };

    } catch (error) {
      console.error('Firebase token creation failed:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to create Firebase token');
    }
  }
);

// NOTE: The old validateClerkToken function has been replaced by the AuthMiddleware
// All token validation now goes through the secure middleware system

/**
 * Ensure user document exists in Firestore
 */
const ensureUserExists = async (clerkUserId: string): Promise<void> => {
  try {
    const userRef = admin.firestore().collection('users').doc(clerkUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`Creating user document for ${clerkUserId}`);
      
      await userRef.set({
        clerkId: clerkUserId, // Use consistent field name
        clerkUserId, // Keep for backward compatibility
        email: null, // Will be updated when available from Clerk
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'student', // Default role - can be upgraded by admin
        displayName: null,
        preferences: {
          notifications: true,
          theme: 'system',
          studyReminders: true
        },
        stats: {
          totalStudyTime: 0,
          sessionsCompleted: 0,
          tokensEarned: 0,
          focusSessionsCompleted: 0
        },
        profile: {
          isPublic: true,
          bio: '',
          goals: []
        }
      });
      
      console.log(`✅ User document created for ${clerkUserId}`);
    } else {
      // Update last active timestamp
      await userRef.update({
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
};