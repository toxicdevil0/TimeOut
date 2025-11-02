/**
 * Secrets Management System
 * Secure handling of sensitive configuration data
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { environmentManager } from './environmentManager';

export interface SecretConfig {
  name: string;
  version?: string;
  required: boolean;
  environments: ('development' | 'staging' | 'production')[];
  fallbackEnvVar?: string;
}

export class SecretsManager {
  private static instance: SecretsManager;
  private client: SecretManagerServiceClient | null = null;
  private secrets: Map<string, string> = new Map();
  private initialized = false;

  private constructor() {
    // Initialize Google Secret Manager client for production
    if (environmentManager.isProduction() || environmentManager.isStaging()) {
      try {
        this.client = new SecretManagerServiceClient();
      } catch (error) {
        console.warn('⚠️  Failed to initialize Secret Manager client:', error);
      }
    }
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Secret configuration definitions
   */
  private getSecretConfigs(): SecretConfig[] {
    const projectId = environmentManager.getConfig().FIREBASE_PROJECT_ID;
    const env = environmentManager.getEnvironment();
    
    return [
      {
        name: `${projectId}-clerk-secret-key`,
        required: true,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'CLERK_SECRET_KEY'
      },
      {
        name: `${projectId}-clerk-jwt-key`,
        required: true,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'CLERK_JWT_KEY'
      },
      {
        name: `${projectId}-jwt-secret`,
        required: true,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'JWT_SECRET'
      },
      {
        name: `${projectId}-sendgrid-api-key`,
        required: true,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'SENDGRID_API_KEY'
      },
      {
        name: `${projectId}-discord-webhook-url`,
        required: false,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'DISCORD_WEBHOOK_URL'
      },
      {
        name: `${projectId}-slack-webhook-url`,
        required: false,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'SLACK_WEBHOOK_URL'
      },
      {
        name: `${projectId}-sentry-dsn`,
        required: env === 'production',
        environments: ['staging', 'production'],
        fallbackEnvVar: 'SENTRY_DSN'
      },
      {
        name: `${projectId}-firebase-admin-key`,
        required: true,
        environments: ['staging', 'production'],
        fallbackEnvVar: 'FIREBASE_ADMIN_PRIVATE_KEY'
      }
    ];
  }

  /**
   * Initialize secrets loading
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔐 Initializing Secrets Manager...');
    const environment = environmentManager.getEnvironment();
    const configs = this.getSecretConfigs();

    // Filter configs for current environment
    const relevantConfigs = configs.filter(config => 
      config.environments.includes(environment)
    );

    const loadPromises = relevantConfigs.map(config => 
      this.loadSecret(config)
    );

    const results = await Promise.allSettled(loadPromises);
    
    let loadedCount = 0;
    let errorCount = 0;
    
    results.forEach((result, index) => {
      const config = relevantConfigs[index];
      
      if (result.status === 'fulfilled') {
        if (result.value) {
          loadedCount++;
          console.log(`   ✅ Loaded secret: ${config.name}`);
        } else if (config.required) {
          errorCount++;
          console.error(`   ❌ Required secret missing: ${config.name}`);
        } else {
          console.log(`   ⚠️  Optional secret not found: ${config.name}`);
        }
      } else {
        errorCount++;
        console.error(`   ❌ Failed to load secret ${config.name}:`, result.reason.message);
      }
    });

    if (errorCount > 0 && environment === 'production') {
      throw new Error(`Failed to load ${errorCount} required secrets in production`);
    }

    this.initialized = true;
    console.log(`🔐 Secrets Manager initialized: ${loadedCount} loaded, ${errorCount} errors`);
  }

  /**
   * Load a single secret
   */
  private async loadSecret(config: SecretConfig): Promise<boolean> {
    const environment = environmentManager.getEnvironment();
    
    try {
      let secretValue: string | null = null;

      // Try loading from Google Secret Manager first (if available)
      if (this.client && (environment === 'production' || environment === 'staging')) {
        try {
          secretValue = await this.loadFromSecretManager(config.name, config.version);
        } catch (error) {
          console.warn(`⚠️  Failed to load ${config.name} from Secret Manager:`, error);
        }
      }

      // Fallback to environment variable
      if (!secretValue && config.fallbackEnvVar) {
        secretValue = process.env[config.fallbackEnvVar] || null;
        if (secretValue && environment !== 'development') {
          console.warn(`⚠️  Using fallback env var for ${config.name}`);
        }
      }

      // Store the secret if found
      if (secretValue) {
        this.secrets.set(config.name, secretValue);
        
        // Also set in process.env for backward compatibility
        if (config.fallbackEnvVar) {
          process.env[config.fallbackEnvVar] = secretValue;
        }
        
        return true;
      }

      return false;
      
    } catch (error) {
      console.error(`Failed to load secret ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Load secret from Google Secret Manager
   */
  private async loadFromSecretManager(name: string, version: string = 'latest'): Promise<string | null> {
    if (!this.client) {
      throw new Error('Secret Manager client not initialized');
    }

    const projectId = environmentManager.getConfig().FIREBASE_PROJECT_ID;
    const secretName = `projects/${projectId}/secrets/${name}/versions/${version}`;

    try {
      const [response] = await this.client.accessSecretVersion({
        name: secretName
      });

      const secretData = response.payload?.data;
      if (!secretData) {
        throw new Error('Secret data is empty');
      }

      return secretData.toString();
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null; // Secret doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get a secret value
   */
  public getSecret(name: string): string | null {
    return this.secrets.get(name) || null;
  }

  /**
   * Check if a secret exists
   */
  public hasSecret(name: string): boolean {
    return this.secrets.has(name);
  }

  /**
   * Get all secret names (for debugging)
   */
  public getSecretNames(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Validate all required secrets are loaded
   */
  public validateSecrets(): boolean {
    const environment = environmentManager.getEnvironment();
    const configs = this.getSecretConfigs();
    
    const missingSecrets = configs
      .filter(config => 
        config.required && 
        config.environments.includes(environment) &&
        !this.hasSecret(config.name)
      )
      .map(config => config.name);

    if (missingSecrets.length > 0) {
      console.error('❌ Missing required secrets:', missingSecrets);
      return false;
    }

    return true;
  }

  /**
   * Create secrets in Google Secret Manager (for setup)
   */
  public async createSecret(name: string, value: string, labels?: Record<string, string>): Promise<void> {
    if (!this.client) {
      throw new Error('Secret Manager client not initialized');
    }

    const projectId = environmentManager.getConfig().FIREBASE_PROJECT_ID;
    const environment = environmentManager.getEnvironment();

    try {
      // Create the secret
      await this.client.createSecret({
        parent: `projects/${projectId}`,
        secretId: name,
        secret: {
          replication: {
            automatic: {}
          },
          labels: {
            environment,
            managed_by: 'timeout-app',
            ...labels
          }
        }
      });

      // Add the secret version
      await this.client.addSecretVersion({
        parent: `projects/${projectId}/secrets/${name}`,
        payload: {
          data: Buffer.from(value, 'utf8')
        }
      });

      console.log(`✅ Created secret: ${name}`);
      
    } catch (error) {
      console.error(`❌ Failed to create secret ${name}:`, error);
      throw error;
    }
  }

  /**
   * Rotate a secret (create new version)
   */
  public async rotateSecret(name: string, newValue: string): Promise<void> {
    if (!this.client) {
      throw new Error('Secret Manager client not initialized');
    }

    const projectId = environmentManager.getConfig().FIREBASE_PROJECT_ID;

    try {
      await this.client.addSecretVersion({
        parent: `projects/${projectId}/secrets/${name}`,
        payload: {
          data: Buffer.from(newValue, 'utf8')
        }
      });

      // Update local cache
      this.secrets.set(name, newValue);

      console.log(`🔄 Rotated secret: ${name}`);
      
    } catch (error) {
      console.error(`❌ Failed to rotate secret ${name}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

/**
 * Initialize secrets on module load for non-development environments
 */
if (!environmentManager.isDevelopment()) {
  secretsManager.initialize().catch(error => {
    console.error('❌ Failed to initialize secrets:', error);
    if (environmentManager.isProduction()) {
      process.exit(1);
    }
  });
}