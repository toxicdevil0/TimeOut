/**
 * Environment Configuration and Validation
 * Centralized environment variable management with validation
 */

// Environment types
export type Environment = 'development' | 'production' | 'test';

// Required environment variables
interface RequiredEnvVars {
  // Clerk Authentication
  VITE_CLERK_PUBLISHABLE_KEY: string;
  
  // Firebase Configuration
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID: string;
}

// Optional environment variables with defaults
interface OptionalEnvVars {
  VITE_APP_NAME: string;
  VITE_APP_VERSION: string;
  VITE_DEMO_MODE: string;
  VITE_LOG_LEVEL: string;
  VITE_ENABLE_ANALYTICS: string;
}

class EnvironmentConfig {
  private readonly env: Environment;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  
  constructor() {
    this.env = this.determineEnvironment();
    this.isDevelopment = this.env === 'development';
    this.isProduction = this.env === 'production';
    
    // Validate environment on initialization
    this.validateEnvironment();
  }

  private determineEnvironment(): Environment {
    if (import.meta.env.MODE === 'production') return 'production';
    if (import.meta.env.MODE === 'test') return 'test';
    return 'development';
  }

  private validateEnvironment(): void {
    const missingVars: string[] = [];
    
    // In production, all required vars must be present
    if (this.isProduction) {
      const requiredVars: (keyof RequiredEnvVars)[] = [
        'VITE_CLERK_PUBLISHABLE_KEY',
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
        'VITE_FIREBASE_MEASUREMENT_ID',
      ];

      requiredVars.forEach(varName => {
        if (!import.meta.env[varName]) {
          missingVars.push(varName);
        }
      });

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables in production: ${missingVars.join(', ')}\n` +
          'Please check your deployment configuration and ensure all required environment variables are set.'
        );
      }
    }

    // Validate Firebase Project ID format
    const projectId = this.getFirebaseProjectId();
    if (projectId && !/^[a-z0-9-]+$/.test(projectId)) {
      console.warn('Warning: Firebase Project ID format looks invalid:', projectId);
    }

    // Validate Clerk key format
    const clerkKey = this.getClerkPublishableKey();
    if (clerkKey && !clerkKey.startsWith('pk_')) {
      console.warn('Warning: Clerk Publishable Key format looks invalid');
    }
  }

  // Getters for required environment variables
  getClerkPublishableKey(): string {
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
  }

  getFirebaseConfig() {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
  }

  getFirebaseProjectId(): string {
    return import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  }

  // Optional environment variables with defaults
  getAppName(): string {
    return import.meta.env.VITE_APP_NAME || 'TimeOut Study App';
  }

  getAppVersion(): string {
    return import.meta.env.VITE_APP_VERSION || '1.0.0';
  }

  isDemoMode(): boolean {
    return import.meta.env.VITE_DEMO_MODE === 'true' || this.isDevelopment;
  }

  getLogLevel(): string {
    return import.meta.env.VITE_LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
  }

  isAnalyticsEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && this.isProduction;
  }

  // Environment checks
  getEnvironment(): Environment {
    return this.env;
  }

  getEnvironmentType(): string {
    return this.env;
  }

  isDev(): boolean {
    return this.isDevelopment;
  }

  isProd(): boolean {
    return this.isProduction;
  }

  isTest(): boolean {
    return this.env === 'test';
  }

  // Feature flags based on environment
  shouldUseEmulator(): boolean {
    return this.isDevelopment && !this.isProductionFirebase();
  }

  private isProductionFirebase(): boolean {
    const projectId = this.getFirebaseProjectId();
    return projectId && !projectId.includes('demo') && !projectId.includes('test');
  }

  // Configuration summary for debugging
  getConfigSummary() {
    return {
      environment: this.env,
      appName: this.getAppName(),
      appVersion: this.getAppVersion(),
      demoMode: this.isDemoMode(),
      logLevel: this.getLogLevel(),
      analyticsEnabled: this.isAnalyticsEnabled(),
      useEmulator: this.shouldUseEmulator(),
      firebaseProjectId: this.getFirebaseProjectId(),
      hasClerkKey: !!this.getClerkPublishableKey(),
    };
  }
}

// Export singleton instance
export const envConfig = new EnvironmentConfig();

// Export for use in other files
export default envConfig;