/**
 * Environment Integration Utilities
 * Integrates environment configuration with existing Firebase Functions
 */

import { environmentManager } from './environmentManager';
import { secretsManager } from './secretsManager';
import { Request } from 'express';
import { logger } from 'firebase-functions';

export interface RequestContext {
  environment: string;
  userId?: string;
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
  rateLimitKey?: string;
  features: Record<string, boolean>;
}

export class EnvironmentIntegration {
  private static instance: EnvironmentIntegration;
  
  private constructor() {}

  public static getInstance(): EnvironmentIntegration {
    if (!EnvironmentIntegration.instance) {
      EnvironmentIntegration.instance = new EnvironmentIntegration();
    }
    return EnvironmentIntegration.instance;
  }

  /**
   * Initialize environment and secrets for function execution
   */
  public async initializeFunction(): Promise<void> {
    try {
      // Ensure environment manager is initialized
      if (!environmentManager.isInitialized()) {
        throw new Error('Environment manager not initialized');
      }

      // Initialize secrets if not in development
      if (!environmentManager.isDevelopment()) {
        await secretsManager.initialize();
        
        if (!secretsManager.validateSecrets()) {
          throw new Error('Required secrets validation failed');
        }
      }

      logger.info('✅ Function environment initialized successfully', {
        environment: environmentManager.getEnvironment(),
        features: environmentManager.getFeatureFlags()
      });

    } catch (error) {
      logger.error('❌ Failed to initialize function environment', error);
      
      if (environmentManager.isProduction()) {
        throw error; // Fail fast in production
      } else {
        logger.warn('⚠️  Continuing with partial initialization in non-production');
      }
    }
  }

  /**
   * Create request context from Express request
   */
  public createRequestContext(req: Request): RequestContext {
    const environment = environmentManager.getEnvironment();
    const features = environmentManager.getFeatureFlags();
    
    return {
      environment,
      requestId: this.generateRequestId(),
      userId: req.body?.userId || req.params?.userId,
      userAgent: req.get('User-Agent'),
      ipAddress: this.getClientIP(req),
      rateLimitKey: this.getRateLimitKey(req),
      features
    };
  }

  /**
   * Get configuration value with environment awareness
   */
  public getConfigValue(key: string, defaultValue?: any): any {
    const config = environmentManager.getConfig() as any;
    
    // Check if value exists in config
    if (config.hasOwnProperty(key)) {
      return config[key];
    }

    // Try to get from secrets
    const secret = secretsManager.getSecret(key);
    if (secret) {
      return secret;
    }

    // Fall back to environment variable
    const envValue = process.env[key];
    if (envValue !== undefined) {
      return envValue;
    }

    return defaultValue;
  }

  /**
   * Check if feature is enabled for current environment
   */
  public isFeatureEnabled(featureName: string): boolean {
    const features = environmentManager.getFeatureFlags();
    return features[featureName] === true;
  }

  /**
   * Get security configuration for current environment
   */
  public getSecurityConfig(): any {
    const config = environmentManager.getConfig();
    const environment = environmentManager.getEnvironment();
    
    return {
      // Rate limiting configuration
      rateLimiting: {
        authRequests: config.RATE_LIMIT_AUTH_REQUESTS,
        authWindow: config.RATE_LIMIT_AUTH_WINDOW,
        generalRequests: config.RATE_LIMIT_GENERAL_REQUESTS,
        generalWindow: config.RATE_LIMIT_GENERAL_WINDOW,
        fileUploads: config.RATE_LIMIT_FILE_UPLOADS,
        fileWindow: config.RATE_LIMIT_FILE_WINDOW,
        ddosThreshold: config.DDOS_PROTECTION_THRESHOLD,
        ddosWindow: config.DDOS_PROTECTION_WINDOW,
        strictMode: environment === 'production'
      },
      
      // Input validation configuration
      validation: {
        strictMode: environment !== 'development',
        maxStringLength: config.MAX_STRING_LENGTH,
        maxFileSize: config.MAX_FILE_SIZE,
        allowedFileTypes: config.ALLOWED_FILE_TYPES.split(','),
        sanitizeHtml: true,
        preventXSS: true,
        preventSQLInjection: true
      },
      
      // Security headers configuration
      headers: {
        contentSecurityPolicy: config.CSP_POLICY,
        hsts: environment === 'production',
        noSniff: true,
        frameGuard: true,
        xssFilter: true
      },
      
      // Monitoring configuration
      monitoring: {
        enableErrorTracking: this.isFeatureEnabled('errorTracking'),
        enablePerformanceMonitoring: this.isFeatureEnabled('performanceMonitoring'),
        logLevel: config.LOG_LEVEL || (environment === 'production' ? 'warn' : 'info'),
        sentryDsn: this.getConfigValue('SENTRY_DSN'),
        enableAuditLogs: environment !== 'development'
      }
    };
  }

  /**
   * Get database configuration for current environment
   */
  public getDatabaseConfig(): any {
    const config = environmentManager.getConfig();
    const environment = environmentManager.getEnvironment();
    
    return {
      // Firestore settings
      firestore: {
        ignoreUndefinedProperties: true,
        timestampsInSnapshots: true,
        experimentalForceLongPolling: environment === 'development'
      },
      
      // Security rules configuration
      security: {
        enforceSchema: environment !== 'development',
        auditWrites: environment === 'production',
        maxDocumentSize: config.MAX_DOCUMENT_SIZE,
        maxBatchSize: config.MAX_BATCH_SIZE,
        enableBackup: environment === 'production'
      },
      
      // Performance settings
      performance: {
        cacheSize: config.CACHE_SIZE,
        enablePersistence: false, // Server-side only
        enableNetwork: true
      }
    };
  }

  /**
   * Get external service configuration
   */
  public getExternalServiceConfig(): any {
    return {
      // Clerk authentication
      clerk: {
        secretKey: this.getConfigValue('CLERK_SECRET_KEY'),
        jwtKey: this.getConfigValue('CLERK_JWT_KEY'),
        webhookSecret: this.getConfigValue('CLERK_WEBHOOK_SECRET')
      },
      
      // SendGrid email service
      sendgrid: {
        apiKey: this.getConfigValue('SENDGRID_API_KEY'),
        fromEmail: this.getConfigValue('SENDGRID_FROM_EMAIL'),
        fromName: this.getConfigValue('SENDGRID_FROM_NAME')
      },
      
      // Discord notifications
      discord: {
        webhookUrl: this.getConfigValue('DISCORD_WEBHOOK_URL'),
        enabled: this.isFeatureEnabled('discordNotifications')
      },
      
      // Slack notifications
      slack: {
        webhookUrl: this.getConfigValue('SLACK_WEBHOOK_URL'),
        enabled: this.isFeatureEnabled('slackNotifications')
      },
      
      // Sentry error tracking
      sentry: {
        dsn: this.getConfigValue('SENTRY_DSN'),
        environment: environmentManager.getEnvironment(),
        enabled: this.isFeatureEnabled('errorTracking')
      }
    };
  }

  /**
   * Validate environment health
   */
  public validateEnvironmentHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Check environment manager
      if (!environmentManager.isInitialized()) {
        issues.push('Environment manager not initialized');
      }

      // Check required configuration
      const config = environmentManager.getConfig() as any;
      const requiredKeys = ['FIREBASE_PROJECT_ID', 'CLERK_SECRET_KEY', 'JWT_SECRET'];
      
      for (const key of requiredKeys) {
        if (!config[key] && !this.getConfigValue(key)) {
          issues.push(`Missing required configuration: ${key}`);
        }
      }

      // Check secrets in production
      if (!environmentManager.isDevelopment()) {
        if (!secretsManager.validateSecrets()) {
          issues.push('Secrets validation failed');
        }
      }

      // Check feature flags
      const features = environmentManager.getFeatureFlags();
      if (!features || Object.keys(features).length === 0) {
        issues.push('No feature flags configured');
      }

    } catch (error) {
      issues.push(`Environment validation error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  // Private utility methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getClientIP(req: Request): string {
    const forwarded = req.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.get('X-Real-IP') || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  }

  private getRateLimitKey(req: Request): string {
    const userId = req.body?.userId || req.params?.userId;
    const ip = this.getClientIP(req);
    
    return userId ? `user:${userId}` : `ip:${ip}`;
  }
}

// Export singleton instance
export const environmentIntegration = EnvironmentIntegration.getInstance();

/**
 * Middleware factory for environment-aware request handling
 */
export function createEnvironmentMiddleware() {
  return async (req: Request, res: any, next: any) => {
    try {
      // Initialize function environment if needed
      await environmentIntegration.initializeFunction();
      
      // Create request context
      const context = environmentIntegration.createRequestContext(req);
      
      // Attach context to request
      (req as any).context = context;
      
      // Add environment info to response headers (non-production only)
      if (!environmentManager.isProduction()) {
        res.set('X-Environment', context.environment);
        res.set('X-Request-ID', context.requestId);
      }
      
      next();
      
    } catch (error) {
      logger.error('Environment middleware error', error);
      
      if (environmentManager.isProduction()) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(500).json({ 
          error: 'Environment initialization failed',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  };
}