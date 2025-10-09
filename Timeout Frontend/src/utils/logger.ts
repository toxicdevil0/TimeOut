/**
 * Centralized Logging System
 * Provides structured logging with different levels and contexts
 */

import { envConfig } from '../config/environment';

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Logger interface
export interface Logger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  fatal(message: string, context?: Record<string, any>): void;
}

// Console logger implementation
class ConsoleLogger implements Logger {
  private minLevel: LogLevel;
  
  constructor(minLevel: LogLevel = LogLevel.DEBUG) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    
    return `${timestamp} ${level}${component}: ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    const formattedMessage = this.formatMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, context);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }
}

// Remote logger for production
class RemoteLogger implements Logger {
  private buffer: LogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private endpoint: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: entries.map(entry => ({
            ...entry,
            timestamp: entry.timestamp.toISOString(),
          })),
        }),
      });
    } catch (error) {
      // If remote logging fails, fallback to console
      console.warn('Failed to send logs to remote endpoint:', error);
      entries.forEach(entry => {
        console.log(`[REMOTE_LOG] ${LogLevel[entry.level]}: ${entry.message}`, entry.context);
      });
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    this.addToBuffer(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  // Clean up on page unload
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Enhanced logger with context
class EnhancedLogger implements Logger {
  private loggers: Logger[] = [];
  private globalContext: Record<string, any> = {};
  private component?: string;

  constructor() {
    this.setupLoggers();
    this.setupGlobalContext();
  }

  private setupLoggers(): void {
    const logLevel = this.getLogLevelFromConfig();
    
    // Console logger (always present in development)
    if (envConfig.isDev()) {
      this.loggers.push(new ConsoleLogger(LogLevel.DEBUG));
    } else {
      this.loggers.push(new ConsoleLogger(logLevel));
    }

    // Remote logger for production
    if (envConfig.isProd()) {
      this.loggers.push(new RemoteLogger('/api/logs'));
    }
  }

  private getLogLevelFromConfig(): LogLevel {
    const configLevel = envConfig.getLogLevel().toLowerCase();
    
    switch (configLevel) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'fatal': return LogLevel.FATAL;
      default: return LogLevel.INFO;
    }
  }

  private setupGlobalContext(): void {
    this.globalContext = {
      appName: envConfig.getAppName(),
      appVersion: envConfig.getAppVersion(),
      environment: envConfig.getEnvironment(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  setComponent(component: string): void {
    this.component = component;
  }

  setGlobalContext(context: Record<string, any>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  private mergeContext(context?: Record<string, any>): Record<string, any> {
    return {
      ...this.globalContext,
      ...(this.component && { component: this.component }),
      ...context,
    };
  }

  debug(message: string, context?: Record<string, any>): void {
    const mergedContext = this.mergeContext(context);
    this.loggers.forEach(logger => logger.debug(message, mergedContext));
  }

  info(message: string, context?: Record<string, any>): void {
    const mergedContext = this.mergeContext(context);
    this.loggers.forEach(logger => logger.info(message, mergedContext));
  }

  warn(message: string, context?: Record<string, any>): void {
    const mergedContext = this.mergeContext(context);
    this.loggers.forEach(logger => logger.warn(message, mergedContext));
  }

  error(message: string, context?: Record<string, any>): void {
    const mergedContext = this.mergeContext(context);
    this.loggers.forEach(logger => logger.error(message, mergedContext));
  }

  fatal(message: string, context?: Record<string, any>): void {
    const mergedContext = this.mergeContext(context);
    this.loggers.forEach(logger => logger.fatal(message, mergedContext));
  }

  // Performance logging
  time(label: string): void {
    console.time(label);
    this.debug(`Timer started: ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`);
  }

  // User action logging
  logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      actionType: 'user_interaction',
      action,
      ...details,
    });
  }

  // Performance metrics
  logPerformanceMetric(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance metric: ${metric}`, {
      metricType: 'performance',
      metric,
      value,
      unit,
    });
  }

  // API call logging
  logApiCall(method: string, url: string, duration?: number, status?: number): void {
    this.info(`API call: ${method} ${url}`, {
      callType: 'api',
      method,
      url,
      duration,
      status,
    });
  }

  // Component lifecycle logging
  logComponentMount(componentName: string): void {
    this.debug(`Component mounted: ${componentName}`, {
      lifecycle: 'mount',
      component: componentName,
    });
  }

  logComponentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, {
      lifecycle: 'unmount',
      component: componentName,
    });
  }

  // Feature usage logging
  logFeatureUsage(feature: string, details?: Record<string, any>): void {
    this.info(`Feature used: ${feature}`, {
      usageType: 'feature',
      feature,
      ...details,
    });
  }

  // Business event logging
  logBusinessEvent(event: string, details?: Record<string, any>): void {
    this.info(`Business event: ${event}`, {
      eventType: 'business',
      event,
      ...details,
    });
  }
}

// Create component-specific logger
export function createLogger(component: string): Logger {
  const logger = new EnhancedLogger();
  logger.setComponent(component);
  return logger;
}

// Export singleton instance
export const logger = new EnhancedLogger();

// Export convenience functions
export const logUserAction = (action: string, details?: Record<string, any>) =>
  logger.logUserAction(action, details);

export const logPerformanceMetric = (metric: string, value: number, unit?: string) =>
  logger.logPerformanceMetric(metric, value, unit);

export const logApiCall = (method: string, url: string, duration?: number, status?: number) =>
  logger.logApiCall(method, url, duration, status);

export const logFeatureUsage = (feature: string, details?: Record<string, any>) =>
  logger.logFeatureUsage(feature, details);

export const logBusinessEvent = (event: string, details?: Record<string, any>) =>
  logger.logBusinessEvent(event, details);

export default logger;