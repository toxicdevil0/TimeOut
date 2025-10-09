/**
 * Security Configuration
 * Manages Content Security Policy, CORS, and other security settings
 */

import { envConfig } from './environment';

export interface SecurityConfig {
  csp: ContentSecurityPolicy;
  cors: CorsConfig;
  headers: SecurityHeaders;
}

interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  frameSrc: string[];
  reportUri?: string;
}

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

interface SecurityHeaders {
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXSSProtection: string;
  referrerPolicy: string;
  hsts?: string;
}

class SecurityConfiguration {
  private readonly config: SecurityConfig;

  constructor() {
    this.config = this.buildSecurityConfig();
  }

  private buildSecurityConfig(): SecurityConfig {
    const isDev = envConfig.isDev();
    const baseOrigins = isDev 
      ? ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080']
      : this.getProductionOrigins();

    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Vite in development
          ...(isDev ? ["'unsafe-eval'"] : []), // Only in development
          "https://www.gstatic.com",
          "https://www.googleapis.com",
          "https://apis.google.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://js.clerk.dev",
          "https://clerk.dev",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for CSS-in-JS and inline styles
          "https://fonts.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",
          "https://images.clerk.dev",
          "https://www.gravatar.com",
        ],
        connectSrc: [
          "'self'",
          ...baseOrigins,
          "https://api.clerk.dev",
          "https://clerk.dev",
          ...(isDev ? [
            "ws://localhost:8080",
            "ws://127.0.0.1:8080",
            "http://localhost:5001", // Firebase Functions Emulator
            "http://localhost:8090", // Firestore Emulator
            "http://localhost:9099", // Auth Emulator
          ] : []),
          "https://firestore.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          `https://${envConfig.getFirebaseProjectId()}.firebaseapp.com`,
          `https://${envConfig.getFirebaseConfig().authDomain}`,
          ...(envConfig.isAnalyticsEnabled() ? [
            "https://www.google-analytics.com",
            "https://analytics.google.com",
          ] : []),
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "blob:"],
        frameSrc: [
          "'self'",
          "https://js.clerk.dev",
          "https://accounts.google.com",
        ],
        reportUri: envConfig.isProd() ? import.meta.env.VITE_CSP_REPORT_URI : undefined,
      },
      cors: {
        allowedOrigins: baseOrigins,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: true,
      },
      headers: {
        xFrameOptions: 'DENY',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        ...(envConfig.isProd() && {
          hsts: 'max-age=31536000; includeSubDomains; preload',
        }),
      },
    };
  }

  private getProductionOrigins(): string[] {
    const configuredOrigins = import.meta.env.VITE_ALLOWED_ORIGINS;
    if (configuredOrigins) {
      return configuredOrigins.split(',').map(origin => origin.trim());
    }
    
    // Default production origins
    return [
      'https://your-domain.com',
      'https://www.your-domain.com',
    ];
  }

  getCSPString(): string {
    const csp = this.config.csp;
    const directives = [
      `default-src ${csp.defaultSrc.join(' ')}`,
      `script-src ${csp.scriptSrc.join(' ')}`,
      `style-src ${csp.styleSrc.join(' ')}`,
      `img-src ${csp.imgSrc.join(' ')}`,
      `connect-src ${csp.connectSrc.join(' ')}`,
      `font-src ${csp.fontSrc.join(' ')}`,
      `object-src ${csp.objectSrc.join(' ')}`,
      `media-src ${csp.mediaSrc.join(' ')}`,
      `frame-src ${csp.frameSrc.join(' ')}`,
    ];

    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    return directives.join('; ');
  }

  getSecurityHeaders(): Record<string, string> {
    const headers = this.config.headers;
    const result: Record<string, string> = {
      'X-Frame-Options': headers.xFrameOptions,
      'X-Content-Type-Options': headers.xContentTypeOptions,
      'X-XSS-Protection': headers.xXSSProtection,
      'Referrer-Policy': headers.referrerPolicy,
      'Content-Security-Policy': this.getCSPString(),
    };

    if (headers.hsts) {
      result['Strict-Transport-Security'] = headers.hsts;
    }

    return result;
  }

  getCorsConfig(): CorsConfig {
    return this.config.cors;
  }

  isOriginAllowed(origin: string): boolean {
    return this.config.cors.allowedOrigins.includes(origin);
  }

  // Validate security configuration
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for insecure CSP in production
    if (envConfig.isProd()) {
      if (this.config.csp.scriptSrc.includes("'unsafe-eval'")) {
        errors.push('Production CSP should not include unsafe-eval');
      }
      
      if (!this.config.headers.hsts) {
        errors.push('HSTS header should be set in production');
      }

      if (!this.config.csp.reportUri) {
        errors.push('CSP report URI should be configured in production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const securityConfig = new SecurityConfiguration();

// Export validation function
export const validateSecurity = () => securityConfig.validateConfiguration();