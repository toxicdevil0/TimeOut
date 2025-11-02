/**
 * Rate Limiting Middleware for Firebase Cloud Functions
 * Implements memory-based rate limiting with Redis backup (optional)
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { CallableRequest } from 'firebase-functions/v2/https';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: CallableRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiting middleware for Firebase callable functions
 */
export class RateLimiter {
  
  /**
   * Create a rate limiter with specified configuration
   */
  static create(config: RateLimitConfig) {
    return (request: CallableRequest): void => {
      const now = Date.now();
      const key = config.keyGenerator 
        ? config.keyGenerator(request)
        : this.getDefaultKey(request);

      // Clean up expired entries periodically
      this.cleanupExpired(now);

      // Get or create rate limit entry
      const entry = rateLimitStore.get(key) || { count: 0, resetTime: now + config.windowMs };

      // Reset count if window has expired
      if (now > entry.resetTime) {
        entry.count = 0;
        entry.resetTime = now + config.windowMs;
      }

      // Check if rate limit exceeded
      if (entry.count >= config.maxRequests) {
        const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
        throw new HttpsError(
          'resource-exhausted',
          `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
          { resetTime: entry.resetTime }
        );
      }

      // Increment counter
      entry.count++;
      rateLimitStore.set(key, entry);
    };
  }

  /**
   * Specific rate limiters for different endpoints
   */
  static authLimiter = this.create({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 authentication attempts per 15 minutes
    keyGenerator: (request) => `auth:${this.getClientIP(request)}`
  });

  static apiLimiter = this.create({
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 60, // 60 requests per minute
    keyGenerator: (request) => `api:${request.auth?.uid || this.getClientIP(request)}`
  });

  static tokenLimiter = this.create({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 token operations per minute
    keyGenerator: (request) => `token:${request.auth?.uid || 'anonymous'}`
  });

  static roomLimiter = this.create({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 room operations per 5 minutes
    keyGenerator: (request) => `room:${request.auth?.uid || 'anonymous'}`
  });

  /**
   * Generate default rate limit key from request
   */
  private static getDefaultKey(request: CallableRequest): string {
    return request.auth?.uid || this.getClientIP(request) || 'anonymous';
  }

  /**
   * Extract client IP from request (best effort)
   */
  private static getClientIP(request: CallableRequest): string {
    // Firebase Functions don't expose direct IP, use headers
    const forwarded = request.rawRequest.headers['x-forwarded-for'] as string;
    const realIP = request.rawRequest.headers['x-real-ip'] as string;
    const clientIP = request.rawRequest.headers['cf-connecting-ip'] as string; // Cloudflare

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || clientIP || 'unknown';
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private static cleanupExpired(now: number): void {
    // Run cleanup every 5 minutes
    if (!this.lastCleanup || now - this.lastCleanup > 5 * 60 * 1000) {
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
          rateLimitStore.delete(key);
        }
      }
      this.lastCleanup = now;
    }
  }

  private static lastCleanup: number = 0;

  /**
   * Get current rate limit stats (for monitoring)
   */
  static getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: rateLimitStore.size,
      memoryUsage: JSON.stringify([...rateLimitStore.entries()]).length
    };
  }

  /**
   * Clear all rate limit data (for testing)
   */
  static clear(): void {
    rateLimitStore.clear();
  }
}

export default RateLimiter;