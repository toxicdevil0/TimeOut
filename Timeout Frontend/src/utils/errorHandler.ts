/**
 * Centralized Error Handling System
 * Provides consistent error handling, logging, and user feedback
 */

import { envConfig } from '../config/environment';

// Error categories for better organization
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Structured error interface
export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  timestamp: Date;
  context?: {
    userId?: string;
    route?: string;
    component?: string;
    action?: string;
    [key: string]: any; // Allow additional context properties
  };
  originalError?: Error;
  stackTrace?: string;
}

// Error reporting interface
export interface ErrorReporter {
  report(error: AppError): Promise<void>;
}

// Console reporter for development
class ConsoleErrorReporter implements ErrorReporter {
  async report(error: AppError): Promise<void> {
    const { id, category, severity, message, details, context, originalError } = error;
    
    console.group(`🚨 Error [${severity.toUpperCase()}] - ${category}`);
    console.error('ID:', id);
    console.error('Message:', message);
    console.error('User Message:', error.userMessage);
    
    if (context) {
      console.error('Context:', context);
    }
    
    if (details) {
      console.error('Details:', details);
    }
    
    if (originalError) {
      console.error('Original Error:', originalError);
    }
    
    console.groupEnd();
  }
}

// Remote error reporter (for production)
class RemoteErrorReporter implements ErrorReporter {
  private endpoint: string;
  
  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }
  
  async report(error: AppError): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...error,
          timestamp: error.timestamp.toISOString(),
          stackTrace: error.originalError?.stack,
        }),
      });
    } catch (reportingError) {
      // Fallback to console if reporting fails
      console.error('Failed to report error:', reportingError);
      console.error('Original error:', error);
    }
  }
}

// Main error handler class
class ErrorHandler {
  private reporters: ErrorReporter[] = [];
  private errorQueue: AppError[] = [];
  private processingQueue = false;

  constructor() {
    this.setupReporters();
    this.setupGlobalErrorHandlers();
  }

  private setupReporters(): void {
    // Always add console reporter for development
    if (envConfig.isDev()) {
      this.addReporter(new ConsoleErrorReporter());
    }

    // Add remote reporter for production
    if (envConfig.isProd()) {
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
      if (sentryDsn) {
        // Initialize Sentry or other error reporting service
        this.addReporter(new RemoteErrorReporter('/api/errors'));
      }
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        message: 'Unhandled promise rejection',
        userMessage: 'An unexpected error occurred. Please try again.',
        originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        context: {
          route: window.location.pathname,
        },
      });
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError({
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        message: event.message || 'Uncaught error',
        userMessage: 'An unexpected error occurred. Please refresh the page.',
        originalError: event.error,
        context: {
          route: window.location.pathname,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  // Main error handling method
  async handleError(errorInput: Partial<AppError> & Pick<AppError, 'category' | 'message' | 'userMessage'>): Promise<string> {
    const error: AppError = {
      id: this.generateErrorId(),
      severity: ErrorSeverity.MEDIUM,
      details: {},
      timestamp: new Date(),
      ...errorInput,
      stackTrace: errorInput.originalError?.stack,
    };

    // Add to queue for processing
    this.errorQueue.push(error);
    
    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processErrorQueue();
    }

    // Return error ID for tracking
    return error.id;
  }

  private async processErrorQueue(): Promise<void> {
    if (this.processingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift()!;
      
      // Report to all configured reporters
      await Promise.allSettled(
        this.reporters.map(reporter => reporter.report(error))
      );
    }

    this.processingQueue = false;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common error types
  handleAuthError(message: string, originalError?: Error, context?: AppError['context']): Promise<string> {
    return this.handleError({
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      message,
      userMessage: 'Authentication failed. Please sign in again.',
      originalError,
      context,
    });
  }

  handleNetworkError(message: string, originalError?: Error, context?: AppError['context']): Promise<string> {
    return this.handleError({
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: 'Network error. Please check your connection and try again.',
      originalError,
      context,
    });
  }

  handleValidationError(message: string, details?: Record<string, any>, context?: AppError['context']): Promise<string> {
    return this.handleError({
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      message,
      userMessage: 'Please check your input and try again.',
      details,
      context,
    });
  }

  handleBusinessLogicError(message: string, userMessage: string, context?: AppError['context']): Promise<string> {
    return this.handleError({
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage,
      context,
    });
  }

  // Error recovery methods
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    context?: AppError['context']
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          break;
        }

        // Log retry attempt
        await this.handleError({
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.LOW,
          message: `Operation failed, retrying (attempt ${attempt}/${maxAttempts})`,
          userMessage: 'Retrying operation...',
          originalError: lastError,
          context: { ...context, attempt },
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    // All attempts failed
    await this.handleError({
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      message: `Operation failed after ${maxAttempts} attempts`,
      userMessage: 'Operation failed after multiple attempts. Please try again later.',
      originalError: lastError,
      context,
    });

    throw lastError;
  }

  // Get error statistics (for monitoring)
  getErrorStats(): { total: number; byCategory: Record<string, number>; bySeverity: Record<string, number> } {
    // This would be implemented with a persistent store in a real application
    return {
      total: 0,
      byCategory: {},
      bySeverity: {},
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export class for testing
export { ErrorHandler };

// Helper functions to create specific error types
export const createNetworkError = (message: string, context?: AppError['context']): AppError => ({
  id: crypto.randomUUID(),
  category: ErrorCategory.NETWORK,
  severity: ErrorSeverity.HIGH,
  message,
  userMessage: 'Connection error. Please check your internet connection and try again.',
  timestamp: new Date(),
  context,
});

export const createValidationError = (message: string, context?: AppError['context']): AppError => ({
  id: crypto.randomUUID(),
  category: ErrorCategory.VALIDATION,
  severity: ErrorSeverity.MEDIUM,
  message,
  userMessage: 'Please check your input and try again.',
  timestamp: new Date(),
  context,
});

export const createAuthError = (message: string, context?: AppError['context']): AppError => ({
  id: crypto.randomUUID(),
  category: ErrorCategory.AUTHENTICATION,
  severity: ErrorSeverity.HIGH,
  message,
  userMessage: 'Authentication failed. Please sign in again.',
  timestamp: new Date(),
  context,
});

export const createBusinessError = (message: string, userMessage?: string, context?: AppError['context']): AppError => ({
  id: crypto.randomUUID(),
  category: ErrorCategory.BUSINESS_LOGIC,
  severity: ErrorSeverity.MEDIUM,
  message,
  userMessage: userMessage || message,
  timestamp: new Date(),
  context,
});

export const createAppError = (
  message: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: AppError['context']
): AppError => ({
  id: crypto.randomUUID(),
  category,
  severity,
  message,
  userMessage: message,
  timestamp: new Date(),
  context,
});

// Export convenience functions
export const handleError = (error: Partial<AppError> & Pick<AppError, 'category' | 'message' | 'userMessage'>) =>
  errorHandler.handleError(error);

export const handleAuthError = (message: string, originalError?: Error, context?: AppError['context']) =>
  errorHandler.handleAuthError(message, originalError, context);

export const handleNetworkError = (message: string, originalError?: Error, context?: AppError['context']) =>
  errorHandler.handleNetworkError(message, originalError, context);

export const handleValidationError = (message: string, details?: Record<string, any>, context?: AppError['context']) =>
  errorHandler.handleValidationError(message, details, context);

export const handleBusinessLogicError = (message: string, userMessage: string, context?: AppError['context']) =>
  errorHandler.handleBusinessLogicError(message, userMessage, context);

export const retryOperation = <T>(
  operation: () => Promise<T>,
  maxAttempts?: number,
  delay?: number,
  context?: AppError['context']
) => errorHandler.retry(operation, maxAttempts, delay, context);

export default errorHandler;