/**
 * Backend Environment Configuration and Validation
 * Centralized environment management for Firebase Cloud Functions
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';

interface RequiredEnvVars {
  FIREBASE_PROJECT_ID: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  CLERK_PUBLISHABLE_KEY: string;
}

interface OptionalEnvVars {
  NODE_ENV?: string;
  ROOM_EXPIRY_HOURS?: string;
  MAX_ROOM_MEMBERS?: string;
  SESSION_TIMEOUT_MINUTES?: string;
  RATE_LIMIT_REQUESTS_PER_MINUTE?: string;
  CORS_ALLOWED_ORIGINS?: string;
  JWT_VERIFY_STRICT?: string;
  ENABLE_DETAILED_LOGGING?: string;
  SENTRY_DSN?: string;
  METRICS_ENABLED?: string;
  FIRESTORE_RETRY_CONFIG: string;
  ENABLE_FIRESTORE_CACHE: string;
}

class BackendEnvironmentConfig {
  private readonly env: Environment;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  private readonly isStaging: boolean;

  constructor() {
    this.env = this.determineEnvironment();
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
    this.isStaging = this.env === 'staging';
    
    this.validateEnvironment();
  }

  private determineEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'staging') return 'staging';
    if (nodeEnv === 'test') return 'test';
    
    // Check for emulator indicators
    if (process.env.FUNCTIONS_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
      return 'development';
    }
    
    return 'development';
  }

  private validateEnvironment(): void {
    const missingVars: string[] = [];
    
    // Check required variables
    const requiredVars: (keyof RequiredEnvVars)[] = [
      'FIREBASE_PROJECT_ID',
      'CLERK_SECRET_KEY',
      'CLERK_WEBHOOK_SECRET',
      'CLERK_PUBLISHABLE_KEY',
    ];

    // In production and staging, all required vars must be present
    if (this.isProduction || this.isStaging) {
      requiredVars.forEach(varName => {
        if (!process.env[varName]) {
          missingVars.push(varName);
        }
      });

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables in ${this.env}: ${missingVars.join(', ')}\n` +
          'Please configure all required environment variables in Firebase Functions config.'
        );
      }
    }

    // Validate Firebase Project ID format
    const projectId = this.getFirebaseProjectId();
    if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
      console.warn('Warning: Firebase Project ID format looks invalid:', projectId);
    }

    // Validate Clerk keys
    const clerkSecretKey = this.getClerkSecretKey();
    if (clerkSecretKey && !clerkSecretKey.startsWith('sk_')) {
      console.warn('Warning: Clerk Secret Key format looks invalid');
    }

    // Validate numeric configurations
    this.validateNumericConfig();
  }

  private validateNumericConfig(): void {
    const roomExpiryHours = this.getRoomExpiryHours();
    if (roomExpiryHours < 1 || roomExpiryHours > 168) { // 1 hour to 1 week
      console.warn(`Warning: Room expiry hours (${roomExpiryHours}) is outside recommended range (1-168)`);
    }

    const maxRoomMembers = this.getMaxRoomMembers();
    if (maxRoomMembers < 2 || maxRoomMembers > 1000) {
      console.warn(`Warning: Max room members (${maxRoomMembers}) is outside recommended range (2-1000)`);
    }

    const sessionTimeout = this.getSessionTimeoutMinutes();
    if (sessionTimeout < 5 || sessionTimeout > 240) { // 5 minutes to 4 hours
      console.warn(`Warning: Session timeout (${sessionTimeout}) is outside recommended range (5-240)`);
    }
  }

  // Environment getters
  getEnvironment(): Environment {
    return this.env;
  }

  isDev(): boolean {
    return this.isDevelopment;
  }

  isProd(): boolean {
    return this.isProduction;
  }

  isStag(): boolean {
    return this.isStaging;
  }

  isTest(): boolean {
    return this.env === 'test';
  }

  // Firebase configuration
  getFirebaseProjectId(): string {
    return process.env.FIREBASE_PROJECT_ID || '';
  }

  // Clerk configuration
  getClerkSecretKey(): string {
    return process.env.CLERK_SECRET_KEY || '';
  }

  getClerkWebhookSecret(): string {
    return process.env.CLERK_WEBHOOK_SECRET || '';
  }

  getClerkPublishableKey(): string {
    return process.env.CLERK_PUBLISHABLE_KEY || '';
  }

  // Application settings
  getRoomExpiryHours(): number {
    return parseInt(process.env.ROOM_EXPIRY_HOURS || '24', 10);
  }

  getMaxRoomMembers(): number {
    return parseInt(process.env.MAX_ROOM_MEMBERS || '50', 10);
  }

  getSessionTimeoutMinutes(): number {
    return parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
  }

  // Security settings
  getRateLimitRequestsPerMinute(): number {
    return parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60', 10);
  }

  getCorsAllowedOrigins(): string[] {
    const origins = process.env.CORS_ALLOWED_ORIGINS || '';
    return origins ? origins.split(',').map(origin => origin.trim()) : [];
  }

  shouldVerifyJwtStrict(): boolean {
    return process.env.JWT_VERIFY_STRICT !== 'false';
  }

  // Monitoring settings
  isDetailedLoggingEnabled(): boolean {
    return process.env.ENABLE_DETAILED_LOGGING === 'true' || this.isDevelopment;
  }

  getSentryDsn(): string {
    return process.env.SENTRY_DSN || '';
  }

  isMetricsEnabled(): boolean {
    return process.env.METRICS_ENABLED !== 'false';
  }

  // Database settings
  getFirestoreRetryConfig(): { maxRetries: number; backoffMultiplier: number } {
    try {
      const config = process.env.FIRESTORE_RETRY_CONFIG;
      if (config) {
        return JSON.parse(config);
      }
    } catch (error) {
      console.warn('Invalid FIRESTORE_RETRY_CONFIG format, using defaults');
    }
    
    return { maxRetries: 3, backoffMultiplier: 2 };
  }

  isFirestoreCacheEnabled(): boolean {
    return process.env.ENABLE_FIRESTORE_CACHE !== 'false';
  }

  // Emulator detection
  isUsingEmulator(): boolean {
    return !!(
      process.env.FUNCTIONS_EMULATOR_HOST ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.AUTH_EMULATOR_HOST ||
      this.isDevelopment
    );
  }

  // Configuration summary
  getConfigSummary() {
    return {
      environment: this.env,
      projectId: this.getFirebaseProjectId(),
      usingEmulator: this.isUsingEmulator(),
      roomExpiryHours: this.getRoomExpiryHours(),
      maxRoomMembers: this.getMaxRoomMembers(),
      sessionTimeoutMinutes: this.getSessionTimeoutMinutes(),
      rateLimitPerMinute: this.getRateLimitRequestsPerMinute(),
      corsOrigins: this.getCorsAllowedOrigins(),
      strictJwtVerification: this.shouldVerifyJwtStrict(),
      detailedLogging: this.isDetailedLoggingEnabled(),
      metricsEnabled: this.isMetricsEnabled(),
      firestoreCacheEnabled: this.isFirestoreCacheEnabled(),
      hasSentryDsn: !!this.getSentryDsn(),
    };
  }

  // Security validation
  validateSecurityConfig(): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (this.isProduction) {
      if (this.isDetailedLoggingEnabled()) {
        warnings.push('Detailed logging is enabled in production - consider disabling for performance');
      }

      if (!this.getSentryDsn()) {
        warnings.push('Sentry DSN not configured - error monitoring is disabled');
      }

      if (this.getCorsAllowedOrigins().length === 0) {
        warnings.push('No CORS origins configured - this may block legitimate requests');
      }

      if (!this.shouldVerifyJwtStrict()) {
        warnings.push('JWT verification is not strict - this may be a security risk');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

// Export singleton instance
export const backendEnvConfig = new BackendEnvironmentConfig();

// Export commonly used functions
export const getEnvironment = () => backendEnvConfig.getEnvironment();
export const isDevelopment = () => backendEnvConfig.isDev();
export const isProduction = () => backendEnvConfig.isProd();
export const isStaging = () => backendEnvConfig.isStag();

export default backendEnvConfig;