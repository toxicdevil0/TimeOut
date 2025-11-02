/**
 * Advanced Rate Limiting System for Firebase Functions
 * Implements multiple rate limiting strategies with production-grade protection
 */

import { HttpsError } from 'firebase-functions/v2/https';
import logger from './logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  skipSuccessful?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
  message?: string;
  statusCode?: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    blocked?: boolean;
    blockExpiry?: number;
  };
}

class AdvancedRateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Authentication Rate Limiting
   * Stricter limits for authentication endpoints
   */
  authLimiter(request: any): void {
    const config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after limit
      message: 'Too many authentication attempts. Please try again later.',
      keyGenerator: (req) => this.getClientKey(req, 'auth')
    };

    this.checkLimit(request, config, 'AUTH_RATE_LIMIT');
  }

  /**
   * API Rate Limiting
   * General API endpoint protection
   */
  apiLimiter(request: any): void {
    const config: RateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      message: 'Too many API requests. Please try again later.',
      keyGenerator: (req) => this.getClientKey(req, 'api')
    };

    this.checkLimit(request, config, 'API_RATE_LIMIT');
  }

  /**
   * Strict Rate Limiting
   * For sensitive operations like user management
   */
  strictLimiter(request: any): void {
    const config: RateLimitConfig = {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 requests per hour
      blockDurationMs: 2 * 60 * 60 * 1000, // Block for 2 hours
      message: 'Too many sensitive operations. Access temporarily restricted.',
      keyGenerator: (req) => this.getClientKey(req, 'strict')
    };

    this.checkLimit(request, config, 'STRICT_RATE_LIMIT');
  }

  /**
   * Burst Protection
   * Prevents rapid-fire requests
   */
  burstLimiter(request: any): void {
    const config: RateLimitConfig = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      message: 'Request rate too high. Please slow down.',
      keyGenerator: (req) => this.getClientKey(req, 'burst')
    };

    this.checkLimit(request, config, 'BURST_RATE_LIMIT');
  }

  /**
   * Check rate limit for a given configuration
   */
  private checkLimit(request: any, config: RateLimitConfig, type: string): void {
    const key = config.keyGenerator ? config.keyGenerator(request) : this.getClientKey(request, type.toLowerCase());
    const now = Date.now();
    
    // Check if client is currently blocked
    const record = this.store[key];
    if (record?.blocked && record.blockExpiry && now < record.blockExpiry) {
      const remainingTime = Math.ceil((record.blockExpiry - now) / 1000);
      
      logger.warn('Rate limit block active', {
        type,
        key,
        remainingTime,
        ip: this.extractIP(request),
        userAgent: request.rawRequest?.headers?.['user-agent']
      });

      throw new HttpsError(
        'resource-exhausted',
        `Access blocked for ${remainingTime} seconds due to rate limit violation.`
      );
    }

    // Initialize or get existing record
    if (!record || now >= record.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
      return;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > config.maxRequests) {
      // Apply block if configured
      if (config.blockDurationMs) {
        record.blocked = true;
        record.blockExpiry = now + config.blockDurationMs;
      }

      logger.warn('Rate limit exceeded', {
        type,
        key,
        count: record.count,
        limit: config.maxRequests,
        blocked: !!config.blockDurationMs,
        ip: this.extractIP(request),
        userAgent: request.rawRequest?.headers?.['user-agent']
      });

      throw new HttpsError(
        'resource-exhausted',
        config.message || 'Rate limit exceeded. Please try again later.'
      );
    }

    // Log successful rate limit check for monitoring
    if (record.count % 10 === 0) { // Log every 10th request
      logger.info('Rate limit status', {
        type,
        count: record.count,
        limit: config.maxRequests,
        remaining: config.maxRequests - record.count
      });
    }
  }

  /**
   * Generate client identifier key
   */
  private getClientKey(request: any, prefix: string): string {
    // Try to get user ID first (most specific)
    const userId = request.auth?.uid || request.data?.userId;
    if (userId) {
      return `${prefix}:user:${userId}`;
    }

    // Fall back to IP address
    const ip = this.extractIP(request);
    if (ip) {
      return `${prefix}:ip:${ip}`;
    }

    // Last resort - use a generic key (should rarely happen)
    return `${prefix}:anonymous`;
  }

  /**
   * Extract client IP address
   */
  private extractIP(request: any): string | null {
    const headers = request.rawRequest?.headers;
    if (!headers) return null;

    // Check common IP headers
    const ipHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip', // Cloudflare
      'fastly-client-ip', // Fastly
      'true-client-ip'
    ];

    for (const header of ipHeaders) {
      const ip = headers[header];
      if (ip) {
        // Handle comma-separated IPs (take the first one)
        return ip.split(',')[0].trim();
      }
    }

    return request.rawRequest?.connection?.remoteAddress || null;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of Object.entries(this.store)) {
      // Remove expired records
      if (now >= record.resetTime && (!record.blocked || (record.blockExpiry && now >= record.blockExpiry))) {
        delete this.store[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Rate limiter cleanup completed', { entriesRemoved: cleaned });
    }
  }

  /**
   * Reset rate limits for a specific key (admin function)
   */
  reset(key?: string): void {
    if (key) {
      delete this.store[key];
      logger.info('Rate limit reset for key', { key });
    } else {
      this.store = {};
      logger.info('All rate limits reset');
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(request: any, type: string = 'api'): any {
    const key = this.getClientKey(request, type);
    const record = this.store[key];
    
    if (!record) {
      return { requests: 0, remaining: 'unlimited', resetTime: null };
    }

    return {
      requests: record.count,
      resetTime: record.resetTime,
      blocked: record.blocked || false,
      blockExpiry: record.blockExpiry || null
    };
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Create singleton instance
export const RateLimiter = new AdvancedRateLimiter();

/**
 * Rate limiting middleware for HTTP functions
 */
export const rateLimitMiddleware = (limiterType: 'auth' | 'api' | 'strict' | 'burst' = 'api') => {
  return (request: any, response: any, next: any) => {
    try {
      switch (limiterType) {
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
      next();
    } catch (error) {
      response.status(429).json({
        error: 'Rate limit exceeded',
        message: error instanceof HttpsError ? error.message : 'Too many requests'
      });
    }
  };
};

/**
 * Express-compatible rate limiter for HTTP endpoints
 */
export const createExpressRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes default
    max: config.maxRequests || 100, // 100 requests per windowMs
    message: {
      error: 'Too many requests',
      message: config.message || 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((config.windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.uid || req.ip || 'anonymous';
    },
    handler: (req: any, res: any) => {
      logger.warn('Express rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: config.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((config.windowMs || 15 * 60 * 1000) / 1000)
      });
    }
  });
};