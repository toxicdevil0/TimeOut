/**
 * Tests for Environment Configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { envConfig } from '../config/environment';

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
      expect(envConfig.isDev()).toBe(true);
      expect(envConfig.isProd()).toBe(false);
    });

    it('should detect production environment', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(envConfig.isProd()).toBe(true);
      expect(envConfig.isDev()).toBe(false);
    });

    it('should detect test environment', () => {
      vi.stubEnv('NODE_ENV', 'test');
      expect(envConfig.isTest()).toBe(true);
    });
  });

  describe('Firebase Configuration', () => {
    it('should return firebase config with all required fields', () => {
      const config = envConfig.getFirebaseConfig();
      
      expect(config).toHaveProperty('apiKey');
      expect(config).toHaveProperty('authDomain');
      expect(config).toHaveProperty('projectId');
      expect(config).toHaveProperty('storageBucket');
      expect(config).toHaveProperty('messagingSenderId');
      expect(config).toHaveProperty('appId');
    });

    it('should return project ID', () => {
      const projectId = envConfig.getFirebaseProjectId();
      expect(typeof projectId).toBe('string');
    });
  });

  describe('Clerk Configuration', () => {
    it('should return clerk publishable key', () => {
      const key = envConfig.getClerkPublishableKey();
      expect(typeof key).toBe('string');
    });
  });

  describe('App Configuration', () => {
    it('should return app name', () => {
      const name = envConfig.getAppName();
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should return app version', () => {
      const version = envConfig.getAppVersion();
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
    });

    it('should return log level', () => {
      const level = envConfig.getLogLevel();
      expect(['debug', 'info', 'warn', 'error']).toContain(level);
    });
  });

  describe('Feature Flags', () => {
    it('should handle demo mode', () => {
      expect(typeof envConfig.isDemoMode()).toBe('boolean');
    });

    it('should handle analytics', () => {
      expect(typeof envConfig.isAnalyticsEnabled()).toBe('boolean');
    });

    it('should handle emulator usage', () => {
      expect(typeof envConfig.shouldUseEmulator()).toBe('boolean');
    });
  });

  describe('Configuration Summary', () => {
    it('should return comprehensive config summary', () => {
      const summary = envConfig.getConfigSummary();
      
      expect(summary).toHaveProperty('environment');
      expect(summary).toHaveProperty('appName');
      expect(summary).toHaveProperty('appVersion');
      expect(summary).toHaveProperty('demoMode');
      expect(summary).toHaveProperty('logLevel');
      expect(summary).toHaveProperty('analyticsEnabled');
      expect(summary).toHaveProperty('useEmulator');
      expect(summary).toHaveProperty('firebaseProjectId');
      expect(summary).toHaveProperty('hasClerkKey');
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to all config methods without errors', () => {
      expect(() => {
        envConfig.getEnvironment();
        envConfig.getAppName();
        envConfig.getAppVersion();
        envConfig.getLogLevel();
        envConfig.getFirebaseConfig();
        envConfig.getClerkPublishableKey();
      }).not.toThrow();
    });
  });
});