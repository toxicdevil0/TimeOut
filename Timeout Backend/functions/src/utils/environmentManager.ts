/**
 * Environment Configuration Manager
 * Handles loading and validating environment-specific configurations
 */

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  // Environment Info
  NODE_ENV: Environment;
  ENVIRONMENT: Environment;
  DEBUG_MODE: boolean;
  VERBOSE_LOGGING: boolean;
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: string;
  FIREBASE_REGION: string;
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_CLIENT_ID: string;
  
  // Authentication
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_JWT_KEY: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Security Settings
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_AUTH_MAX: number;
  RATE_LIMIT_AUTH_REQUESTS: number;
  RATE_LIMIT_AUTH_WINDOW: number;
  RATE_LIMIT_GENERAL_REQUESTS: number;
  RATE_LIMIT_GENERAL_WINDOW: number;
  RATE_LIMIT_FILE_UPLOADS: number;
  RATE_LIMIT_FILE_WINDOW: number;
  DDOS_PROTECTION_THRESHOLD: number;
  DDOS_PROTECTION_WINDOW: number;
  DDOS_SUSPICIOUS_THRESHOLD: number;
  DDOS_BLOCK_THRESHOLD: number;
  SECURITY_HEADERS_ENABLED: boolean;
  MAX_STRING_LENGTH: number;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
  CSP_POLICY: string;
  MAX_DOCUMENT_SIZE: number;
  MAX_BATCH_SIZE: number;
  CACHE_SIZE: number;
  
  // External Services
  SENDGRID_API_KEY: string;
  SENDGRID_FROM_EMAIL: string;
  DISCORD_WEBHOOK_URL: string;
  SLACK_WEBHOOK_URL: string;
  
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT_MS: number;
  CORS_ORIGIN: string;
  
  // Monitoring
  LOG_LEVEL: string;
  ERROR_REPORTING_ENABLED: boolean;
  SENTRY_DSN?: string;
  PERFORMANCE_MONITORING_ENABLED: boolean;
}

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  private environment: Environment;
  private initialized = false;

  private constructor() {
    this.environment = this.detectEnvironment();
    this.loadEnvironmentFile();
    this.config = this.parseConfiguration();
    this.validateConfiguration();
    this.initialized = true;
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV as Environment;
    const envOverride = process.env.TIMEOUT_ENV as Environment;
    
    // Allow explicit environment override
    if (envOverride && ['development', 'staging', 'production'].includes(envOverride)) {
      return envOverride;
    }
    
    // Use NODE_ENV if valid
    if (nodeEnv && ['development', 'staging', 'production'].includes(nodeEnv)) {
      return nodeEnv;
    }
    
    // Default to development
    console.warn('⚠️  No valid environment detected, defaulting to development');
    return 'development';
  }

  /**
   * Load appropriate environment file
   */
  private loadEnvironmentFile(): void {
    const rootDir = process.cwd();
    const envFiles = [
      `.env.${this.environment}.local`,
      `.env.${this.environment}`,
      '.env.local',
      '.env'
    ];

    let loaded = false;
    for (const envFile of envFiles) {
      const envPath = join(rootDir, envFile);
      if (existsSync(envPath)) {
        console.log(`🔧 Loading environment from: ${envFile}`);
        dotenv.config({ path: envPath });
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      console.warn(`⚠️  No environment file found for ${this.environment}`);
    }
  }

  /**
   * Parse environment variables into typed configuration
   */
  private parseConfiguration(): EnvironmentConfig {
    const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
      if (!value) return defaultValue;
      return value.toLowerCase() === 'true';
    };

    const parseNumber = (value: string | undefined, defaultValue: number): number => {
      if (!value) return defaultValue;
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    return {
      // Environment Info
      NODE_ENV: this.environment,
      ENVIRONMENT: this.environment,
      DEBUG_MODE: parseBoolean(process.env.DEBUG_MODE, this.environment === 'development'),
      VERBOSE_LOGGING: parseBoolean(process.env.VERBOSE_LOGGING, this.environment !== 'production'),
      
      // Firebase Configuration
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || `timeout-backend-${this.environment}`,
      FIREBASE_REGION: process.env.FIREBASE_REGION || 'us-central1',
      FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY || '',
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
      FIREBASE_ADMIN_CLIENT_ID: process.env.FIREBASE_ADMIN_CLIENT_ID || '',
      
      // Authentication
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
      CLERK_JWT_KEY: process.env.CLERK_JWT_KEY || '',
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
      
      // Security Settings
      RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 
        this.environment === 'production' ? 60 : this.environment === 'staging' ? 100 : 1000),
      RATE_LIMIT_AUTH_MAX: parseNumber(process.env.RATE_LIMIT_AUTH_MAX,
        this.environment === 'production' ? 10 : this.environment === 'staging' ? 15 : 50),
      RATE_LIMIT_AUTH_REQUESTS: parseNumber(process.env.RATE_LIMIT_AUTH_REQUESTS,
        this.environment === 'production' ? 10 : 15),
      RATE_LIMIT_AUTH_WINDOW: parseNumber(process.env.RATE_LIMIT_AUTH_WINDOW, 15 * 60 * 1000),
      RATE_LIMIT_GENERAL_REQUESTS: parseNumber(process.env.RATE_LIMIT_GENERAL_REQUESTS,
        this.environment === 'production' ? 100 : 200),
      RATE_LIMIT_GENERAL_WINDOW: parseNumber(process.env.RATE_LIMIT_GENERAL_WINDOW, 60 * 1000),
      RATE_LIMIT_FILE_UPLOADS: parseNumber(process.env.RATE_LIMIT_FILE_UPLOADS, 10),
      RATE_LIMIT_FILE_WINDOW: parseNumber(process.env.RATE_LIMIT_FILE_WINDOW, 60 * 60 * 1000),
      DDOS_PROTECTION_THRESHOLD: parseNumber(process.env.DDOS_PROTECTION_THRESHOLD,
        this.environment === 'production' ? 200 : 300),
      DDOS_PROTECTION_WINDOW: parseNumber(process.env.DDOS_PROTECTION_WINDOW, 60 * 1000),
      DDOS_SUSPICIOUS_THRESHOLD: parseNumber(process.env.DDOS_SUSPICIOUS_THRESHOLD,
        this.environment === 'production' ? 50 : 100),
      DDOS_BLOCK_THRESHOLD: parseNumber(process.env.DDOS_BLOCK_THRESHOLD,
        this.environment === 'production' ? 100 : 200),
      SECURITY_HEADERS_ENABLED: parseBoolean(process.env.SECURITY_HEADERS_ENABLED, 
        this.environment !== 'development'),
      MAX_STRING_LENGTH: parseNumber(process.env.MAX_STRING_LENGTH, 10000),
      MAX_FILE_SIZE: parseNumber(process.env.MAX_FILE_SIZE, 10 * 1024 * 1024),
      ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif',
      CSP_POLICY: process.env.CSP_POLICY || "default-src 'self'",
      MAX_DOCUMENT_SIZE: parseNumber(process.env.MAX_DOCUMENT_SIZE, 1048576),
      MAX_BATCH_SIZE: parseNumber(process.env.MAX_BATCH_SIZE, 500),
      CACHE_SIZE: parseNumber(process.env.CACHE_SIZE, 41943040),
      
      // External Services
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || '',
      DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
      SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
      
      // API Configuration
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5001',
      API_TIMEOUT_MS: parseNumber(process.env.API_TIMEOUT_MS, 30000),
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      
      // Monitoring
      LOG_LEVEL: process.env.LOG_LEVEL || (this.environment === 'production' ? 'error' : 'debug'),
      ERROR_REPORTING_ENABLED: parseBoolean(process.env.ERROR_REPORTING_ENABLED, 
        this.environment !== 'development'),
      SENTRY_DSN: process.env.SENTRY_DSN,
      PERFORMANCE_MONITORING_ENABLED: parseBoolean(process.env.PERFORMANCE_MONITORING_ENABLED,
        this.environment !== 'development')
    };
  }

  /**
   * Validate required configuration values
   */
  private validateConfiguration(): void {
    const errors: string[] = [];

    // Required for all environments
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'FIREBASE_PROJECT_ID',
      'JWT_SECRET'
    ];

    // Required for non-development environments
    if (this.environment !== 'development') {
      requiredFields.push(
        'FIREBASE_ADMIN_PRIVATE_KEY',
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        'CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY'
      );
    }

    // Required for production
    if (this.environment === 'production') {
      requiredFields.push(
        'SENDGRID_API_KEY',
        'SENTRY_DSN'
      );
    }

    // Check required fields
    for (const field of requiredFields) {
      const value = this.config[field];
      if (!value || (typeof value === 'string' && value.includes('REPLACE_WITH_REAL_VALUE'))) {
        errors.push(`Missing or invalid required field: ${field}`);
      }
    }

    // Validate JWT secret strength
    if (this.config.JWT_SECRET && this.config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    // Validate production-specific requirements
    if (this.environment === 'production') {
      if (this.config.DEBUG_MODE) {
        errors.push('DEBUG_MODE must be false in production');
      }
      
      if (this.config.CORS_ORIGIN === '*') {
        errors.push('CORS_ORIGIN must be restricted in production');
      }
    }

    // Report validation errors
    if (errors.length > 0) {
      console.error('❌ Environment Configuration Errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      
      if (this.environment === 'production') {
        throw new Error('Invalid production configuration. Deployment aborted.');
      } else {
        console.warn('⚠️  Configuration warnings detected. Please review.');
      }
    } else {
      console.log(`✅ Environment configuration validated for ${this.environment}`);
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get current environment
   */
  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Check if in development mode
   */
  public isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if in staging mode
   */
  public isStaging(): boolean {
    return this.environment === 'staging';
  }

  /**
   * Check if in production mode
   */
  public isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Check if environment manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get environment-specific feature flags
   */
  public getFeatureFlags(): Record<string, boolean> {
    const baseFlags = {
      RATE_LIMITING: true,
      DDOS_PROTECTION: !this.isDevelopment(),
      SECURITY_ALERTS: true,
      FILE_UPLOADS: true,
      REAL_TIME_SYNC: true,
      ANALYTICS: !this.isDevelopment(),
      EXPERIMENTAL_FEATURES: this.isDevelopment()
    };

    // Override with environment variables if present
    Object.keys(baseFlags).forEach(flag => {
      const envValue = process.env[`FEATURE_FLAG_${flag}`];
      if (envValue !== undefined) {
        baseFlags[flag as keyof typeof baseFlags] = envValue.toLowerCase() === 'true';
      }
    });

    return baseFlags;
  }

  /**
   * Print environment summary
   */
  public printSummary(): void {
    const config = this.getConfig();
    const flags = this.getFeatureFlags();

    console.log('\n🌍 Environment Configuration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Environment: ${this.environment.toUpperCase()}`);
    console.log(`🔧 Debug Mode: ${config.DEBUG_MODE ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`📝 Verbose Logging: ${config.VERBOSE_LOGGING ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`🔒 Security Headers: ${config.SECURITY_HEADERS_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`📊 Error Reporting: ${config.ERROR_REPORTING_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`⚡ Performance Monitoring: ${config.PERFORMANCE_MONITORING_ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`🛡️  Rate Limit: ${config.RATE_LIMIT_MAX_REQUESTS} req/min`);
    console.log(`🚫 DDoS Threshold: ${config.DDOS_BLOCK_THRESHOLD} req/5min`);
    console.log(`🌐 CORS Origin: ${config.CORS_ORIGIN}`);
    console.log(`🔑 JWT Expires: ${config.JWT_EXPIRES_IN}`);
    
    console.log('\n🚩 Feature Flags:');
    Object.entries(flags).forEach(([flag, enabled]) => {
      console.log(`   ${enabled ? '✅' : '❌'} ${flag}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();

// Export configuration for easy access
export const config = environmentManager.getConfig();
export const environment = environmentManager.getEnvironment();
export const featureFlags = environmentManager.getFeatureFlags();

// Print summary on module load (only in development)
if (environmentManager.isDevelopment()) {
  environmentManager.printSummary();
}