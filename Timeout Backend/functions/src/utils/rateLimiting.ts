/**
 * Advanced Rate Limiting & DDoS Protection System
 * Comprehensive protection for Firebase Cloud Functions
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Max requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean;     // Skip counting failed requests
  blockDurationMs?: number;   // How long to block after limit exceeded
  keyGenerator?: (request: any) => string; // Custom key generation
  onLimitReached?: (key: string, request: any) => void; // Callback when limit reached
}

/**
 * DDoS detection configuration
 */
export interface DDoSConfig {
  suspiciousThreshold: number;    // Requests that trigger monitoring
  blockThreshold: number;         // Requests that trigger blocking
  monitorWindowMs: number;        // Time window for monitoring
  blockDurationMs: number;        // How long to block suspicious IPs
  whitelistedIPs?: string[];      // IPs to never block
  patternDetection: boolean;      // Enable pattern-based detection
}

/**
 * In-memory storage for rate limiting (production should use Redis)
 */
class RateLimitStore {
  private store = new Map<string, any>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get(key: string) {
    return this.store.get(key);
  }

  set(key: string, value: any, ttlMs: number) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { ...value, expiresAt });
  }

  delete(key: string) {
    this.store.delete(key);
  }

  increment(key: string, ttlMs: number = 60000): number {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || entry.expiresAt < now) {
      this.store.set(key, { count: 1, expiresAt: now + ttlMs });
      return 1;
    }
    
    entry.count += 1;
    return entry.count;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Global rate limit store
 */
const rateLimitStore = new RateLimitStore();

/**
 * DDoS protection store
 */
const ddosStore = new RateLimitStore();

/**
 * Blocked IPs store
 */
const blockedIPs = new Set<string>();

/**
 * Extract IP address from request
 */
function getClientIP(request: any): string {
  // Check various headers for the real IP
  const forwarded = request.headers['x-forwarded-for'];
  const realIP = request.headers['x-real-ip'];
  const cfConnectingIP = request.headers['cf-connecting-ip']; // Cloudflare
  
  if (forwarded) {
    const ips = forwarded.split(',');
    return ips[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return request.ip || request.connection?.remoteAddress || 'unknown';
}

/**
 * Generate rate limit key
 */
function generateRateLimitKey(request: any, prefix: string = 'rate_limit'): string {
  const ip = getClientIP(request);
  const userId = request.auth?.uid || 'anonymous';
  
  // Use IP + User ID for authenticated requests, just IP for anonymous
  if (userId !== 'anonymous') {
    return `${prefix}:user:${userId}:${ip}`;
  }
  
  return `${prefix}:ip:${ip}`;
}

/**
 * Advanced rate limiter
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: any, response?: any) => {
    const key = config.keyGenerator ? config.keyGenerator(request) : generateRateLimitKey(request);
    const now = Date.now();
    
    // Check if IP is blocked
    const ip = getClientIP(request);
    if (blockedIPs.has(ip)) {
      throw new HttpsError('resource-exhausted', 'IP address is temporarily blocked due to suspicious activity');
    }
    
    // Get current request count
    const currentCount = rateLimitStore.increment(key, config.windowMs);
    
    // Check if limit exceeded
    if (currentCount > config.maxRequests) {
      // Block IP if configured
      if (config.blockDurationMs) {
        blockedIPs.add(ip);
        setTimeout(() => {
          blockedIPs.delete(ip);
        }, config.blockDurationMs);
      }
      
      // Trigger callback if provided
      if (config.onLimitReached) {
        config.onLimitReached(key, request);
      }
      
      // Log security event
      await logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        ip,
        key,
        currentCount,
        maxRequests: config.maxRequests,
        userAgent: request.headers['user-agent'],
        userId: request.auth?.uid
      });
      
      throw new HttpsError(
        'resource-exhausted',
        `Too many requests. Limit: ${config.maxRequests} per ${config.windowMs / 1000} seconds. Current: ${currentCount}`
      );
    }
    
    return {
      allowed: true,
      remaining: config.maxRequests - currentCount,
      resetTime: now + config.windowMs,
      currentCount
    };
  };
}

/**
 * DDoS protection middleware
 */
export function createDDoSProtection(config: DDoSConfig) {
  return async (request: any, response?: any) => {
    const ip = getClientIP(request);
    
    // Skip whitelisted IPs
    if (config.whitelistedIPs?.includes(ip)) {
      return { allowed: true, status: 'whitelisted' };
    }
    
    // Check if IP is already blocked
    if (blockedIPs.has(ip)) {
      await logSecurityEvent('DDOS_BLOCKED_REQUEST', { ip });
      throw new HttpsError('resource-exhausted', 'IP address is blocked due to suspicious activity');
    }
    
    const ddosKey = `ddos:${ip}`;
    const requestCount = ddosStore.increment(ddosKey, config.monitorWindowMs);
    
    // Suspicious activity detection
    if (requestCount >= config.suspiciousThreshold) {
      await logSecurityEvent('DDOS_SUSPICIOUS_ACTIVITY', {
        ip,
        requestCount,
        threshold: config.suspiciousThreshold,
        userAgent: request.headers['user-agent']
      });
    }
    
    // Block if threshold exceeded
    if (requestCount >= config.blockThreshold) {
      blockedIPs.add(ip);
      
      // Auto-unblock after duration
      setTimeout(() => {
        blockedIPs.delete(ip);
      }, config.blockDurationMs);
      
      await logSecurityEvent('DDOS_IP_BLOCKED', {
        ip,
        requestCount,
        blockDuration: config.blockDurationMs
      });
      
      throw new HttpsError('resource-exhausted', 'IP address blocked due to excessive requests');
    }
    
    // Pattern detection (basic implementation)
    if (config.patternDetection) {
      await detectSuspiciousPatterns(request);
    }
    
    return {
      allowed: true,
      requestCount,
      status: requestCount >= config.suspiciousThreshold ? 'suspicious' : 'normal'
    };
  };
}

/**
 * Detect suspicious request patterns
 */
async function detectSuspiciousPatterns(request: any): Promise<void> {
  const ip = getClientIP(request);
  const userAgent = request.headers['user-agent'] || '';
  
  // Check for bot patterns
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    await logSecurityEvent('SUSPICIOUS_USER_AGENT', { ip, userAgent });
  }
  
  // Check for missing common headers
  const expectedHeaders = ['accept', 'accept-language', 'accept-encoding'];
  const missingHeaders = expectedHeaders.filter(header => !request.headers[header]);
  
  if (missingHeaders.length >= 2) {
    await logSecurityEvent('SUSPICIOUS_HEADERS', { 
      ip, 
      userAgent,
      missingHeaders 
    });
  }
  
  // Check for rapid sequential requests (same IP, different endpoints)
  const sequentialKey = `sequential:${ip}`;
  const sequentialCount = rateLimitStore.increment(sequentialKey, 5000); // 5 second window
  
  if (sequentialCount > 10) {
    await logSecurityEvent('SUSPICIOUS_SEQUENTIAL_REQUESTS', {
      ip,
      count: sequentialCount,
      userAgent
    });
  }
}

/**
 * Exponential backoff rate limiter
 */
export function createExponentialBackoffLimiter(baseConfig: RateLimitConfig) {
  return async (request: any, response?: any) => {
    const key = generateRateLimitKey(request, 'exponential');
    const violationKey = `violations:${key}`;
    
    // Get violation count
    const violations = rateLimitStore.get(violationKey) || { count: 0, lastViolation: 0 };
    
    // Calculate backoff multiplier
    const backoffMultiplier = Math.pow(2, Math.min(violations.count, 10)); // Cap at 2^10
    const adjustedLimit = Math.max(1, Math.floor(baseConfig.maxRequests / backoffMultiplier));
    
    const currentCount = rateLimitStore.increment(key, baseConfig.windowMs);
    
    if (currentCount > adjustedLimit) {
      // Increment violation count
      violations.count += 1;
      violations.lastViolation = Date.now();
      rateLimitStore.set(violationKey, violations, 24 * 60 * 60 * 1000); // 24 hour TTL
      
      await logSecurityEvent('EXPONENTIAL_BACKOFF_TRIGGERED', {
        ip: getClientIP(request),
        violations: violations.count,
        adjustedLimit,
        backoffMultiplier
      });
      
      throw new HttpsError(
        'resource-exhausted',
        `Rate limit exceeded. Adjusted limit: ${adjustedLimit} (violations: ${violations.count})`
      );
    }
    
    return {
      allowed: true,
      remaining: adjustedLimit - currentCount,
      adjustedLimit,
      violations: violations.count
    };
  };
}

/**
 * Function-specific rate limiters
 */
export const RateLimiters = {
  // Authentication functions - strict limits
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,           // 10 auth attempts per 15 min
    blockDurationMs: 30 * 60 * 1000 // Block for 30 minutes
  }),
  
  // Room creation - moderate limits
  createRoom: createRateLimiter({
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 rooms per minute
    blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes
  }),
  
  // General API calls - generous limits
  general: createRateLimiter({
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
    blockDurationMs: 60 * 1000 // Block for 1 minute
  }),
  
  // File uploads - very strict limits
  fileUpload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,          // 10 uploads per hour
    blockDurationMs: 60 * 60 * 1000 // Block for 1 hour
  }),
  
  // Token operations - moderate limits
  tokens: createRateLimiter({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 50,          // 50 token operations per 5 min
    blockDurationMs: 10 * 60 * 1000 // Block for 10 minutes
  })
};

/**
 * DDoS protection configurations
 */
export const DDoSProtection = {
  // Standard DDoS protection
  standard: createDDoSProtection({
    suspiciousThreshold: 100,     // Monitor after 100 requests/5min
    blockThreshold: 200,          // Block after 200 requests/5min
    monitorWindowMs: 5 * 60 * 1000,  // 5 minute window
    blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
    patternDetection: true
  }),
  
  // Strict DDoS protection for sensitive endpoints
  strict: createDDoSProtection({
    suspiciousThreshold: 50,      // Monitor after 50 requests/5min
    blockThreshold: 100,          // Block after 100 requests/5min
    monitorWindowMs: 5 * 60 * 1000,  // 5 minute window
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
    patternDetection: true
  })
};

/**
 * Log security events
 */
async function logSecurityEvent(type: string, data: any): Promise<void> {
  try {
    const event = {
      type,
      timestamp: new Date(),
      data,
      severity: getSeverity(type),
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
    
    // Log to Firestore (production should also log to external service)
    await db.collection('securityEvents').add(event);
    
    // Log to console for development
    console.warn(`🚨 SECURITY EVENT [${type}]:`, JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get severity level for security events
 */
function getSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'RATE_LIMIT_EXCEEDED': 'medium',
    'DDOS_SUSPICIOUS_ACTIVITY': 'medium',
    'DDOS_BLOCKED_REQUEST': 'high',
    'DDOS_IP_BLOCKED': 'high',
    'SUSPICIOUS_USER_AGENT': 'low',
    'SUSPICIOUS_HEADERS': 'low',
    'SUSPICIOUS_SEQUENTIAL_REQUESTS': 'medium',
    'EXPONENTIAL_BACKOFF_TRIGGERED': 'medium'
  };
  
  return severityMap[type] || 'low';
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(options: {
  rateLimiter?: (request: any) => Promise<any>;
  ddosProtection?: (request: any) => Promise<any>;
  exponentialBackoff?: boolean;
}) {
  return async (request: any, response?: any) => {
    try {
      // Apply DDoS protection first
      if (options.ddosProtection) {
        await options.ddosProtection(request);
      }
      
      // Apply rate limiting
      if (options.rateLimiter) {
        await options.rateLimiter(request);
      }
      
      // Apply exponential backoff if enabled
      if (options.exponentialBackoff) {
        const backoffLimiter = createExponentialBackoffLimiter({
          windowMs: 60 * 1000,
          maxRequests: 60
        });
        await backoffLimiter(request);
      }
      
      return { allowed: true };
      
    } catch (error) {
      // Log the security block
      await logSecurityEvent('SECURITY_MIDDLEWARE_BLOCK', {
        ip: getClientIP(request),
        error: error instanceof Error ? error.message : 'Unknown error',
        userAgent: request.headers['user-agent']
      });
      
      throw error;
    }
  };
}

/**
 * Get current system status
 */
export function getSecurityStatus(): any {
  return {
    blockedIPs: Array.from(blockedIPs),
    blockedCount: blockedIPs.size,
    storeSize: rateLimitStore['store'].size,
    ddosStoreSize: ddosStore['store'].size,
    timestamp: new Date()
  };
}

/**
 * Manual IP blocking/unblocking
 */
export function blockIP(ip: string, durationMs: number = 60 * 60 * 1000): void {
  blockedIPs.add(ip);
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, durationMs);
  
  logSecurityEvent('MANUAL_IP_BLOCK', { ip, durationMs });
}

export function unblockIP(ip: string): void {
  const wasBlocked = blockedIPs.delete(ip);
  if (wasBlocked) {
    logSecurityEvent('MANUAL_IP_UNBLOCK', { ip });
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup(): void {
  rateLimitStore.destroy();
  ddosStore.destroy();
  blockedIPs.clear();
}