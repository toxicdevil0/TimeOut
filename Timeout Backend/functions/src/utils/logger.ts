/**
 * Production-Safe Logging Utility
 * Replaces console.log with environment-aware logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp?: boolean;
  module?: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private static isDevelopment = process.env.NODE_ENV !== 'production';
  private static isTest = process.env.NODE_ENV === 'test';

  /**
   * Development-only debug logging
   */
  static debug(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment && !this.isTest) {
      this.log('debug', message, data, context);
    }
  }

  /**
   * Info logging (enabled in development, structured in production)
   */
  static info(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('info', message, data, context);
    } else {
      // In production, use structured logging for monitoring
      this.structuredLog('info', message, data, context);
    }
  }

  /**
   * Warning logging (always enabled)
   */
  static warn(message: string, data?: any, context?: LogContext): void {
    this.log('warn', message, data, context);
  }

  /**
   * Error logging (always enabled)
   */
  static error(message: string, error?: Error | any, context?: LogContext): void {
    if (error instanceof Error) {
      this.log('error', message, {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        ...(typeof error === 'object' ? error : {})
      }, context);
    } else {
      this.log('error', message, error, context);
    }
  }

  /**
   * Success logging (development only)
   */
  static success(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`✅ ${this.formatMessage(message, context)}`, data || '');
    }
  }

  /**
   * Security event logging (always enabled, structured in production)
   */
  static security(event: string, details: any, context?: LogContext): void {
    const securityLog = {
      event,
      timestamp: new Date().toISOString(),
      details,
      ...context
    };

    if (this.isDevelopment) {
      console.warn(`🔒 SECURITY: ${event}`, securityLog);
    } else {
      // In production, send to security monitoring service
      this.structuredLog('warn', `Security Event: ${event}`, securityLog, context);
    }
  }

  /**
   * Performance logging (development only)
   */
  static performance(operation: string, duration: number, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`⚡ ${operation}: ${duration}ms`, context || '');
    }
  }

  /**
   * API request logging
   */
  static request(method: string, path: string, status: number, duration: number, context?: LogContext): void {
    const logData = {
      method,
      path,
      status,
      duration: `${duration}ms`,
      ...context
    };

    if (this.isDevelopment) {
      const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
      console.log(`${emoji} ${method} ${path} ${status} (${duration}ms)`);
    } else {
      this.structuredLog('info', 'API Request', logData, context);
    }
  }

  /**
   * Internal logging implementation
   */
  private static log(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    const formattedMessage = this.formatMessage(message, context);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data || '');
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }
  }

  /**
   * Structured logging for production monitoring
   */
  private static structuredLog(level: LogLevel, message: string, data?: any, context?: LogContext): void {
    // In a real production environment, this would send to a logging service
    // like Cloud Logging, Datadog, or similar monitoring platform
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      ...context
    };

    // For now, output as JSON for structured log collection
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Format message with context
   */
  private static formatMessage(message: string, context?: LogContext): string {
    let formatted = message;

    if (context?.timestamp !== false) {
      formatted = `[${new Date().toISOString()}] ${formatted}`;
    }

    if (context?.module) {
      formatted = `[${context.module}] ${formatted}`;
    }

    if (context?.userId) {
      formatted = `[User:${context.userId}] ${formatted}`;
    }

    if (context?.requestId) {
      formatted = `[Req:${context.requestId}] ${formatted}`;
    }

    return formatted;
  }

  /**
   * Create a module-specific logger
   */
  static createModuleLogger(module: string) {
    return {
      debug: (msg: string, data?: any) => this.debug(msg, data, { module }),
      info: (msg: string, data?: any) => this.info(msg, data, { module }),
      warn: (msg: string, data?: any) => this.warn(msg, data, { module }),
      error: (msg: string, error?: any) => this.error(msg, error, { module }),
      success: (msg: string, data?: any) => this.success(msg, data, { module }),
      request: (method: string, path: string, status: number, duration: number) => 
        this.request(method, path, status, duration, { module })
    };
  }
}

// Export for use across the application
export default Logger;

// Convenience exports
export const log = Logger;
export const createLogger = Logger.createModuleLogger;