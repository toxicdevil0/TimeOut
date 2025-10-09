/**
 * Performance Monitoring Utilities
 * Provides tools for measuring and tracking application performance
 */

import React from 'react';
import { logger } from './logger';
import { envConfig } from '../config/environment';

// Performance metric types
export enum MetricType {
  LOAD_TIME = 'load_time',
  RENDER_TIME = 'render_time',
  API_RESPONSE = 'api_response',
  USER_INTERACTION = 'user_interaction',
  MEMORY_USAGE = 'memory_usage',
  BUNDLE_SIZE = 'bundle_size',
  NETWORK_LATENCY = 'network_latency',
  ERROR_RATE = 'error_rate',
}

// Performance entry interface
export interface PerformanceMetric {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  component?: string;
  metadata?: Record<string, any>;
}

// Performance observer wrapper
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private timers: Map<string, number> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = envConfig.isDev() || envConfig.getLogLevel() === 'debug';
    this.setupPerformanceObservers();
    this.setupWebVitals();
  }

  private setupPerformanceObservers(): void {
    if (!this.enabled || typeof PerformanceObserver === 'undefined') return;

    // Navigation timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              name: 'page_load_time',
              type: MetricType.LOAD_TIME,
              value: navEntry.loadEventEnd - navEntry.fetchStart,
              unit: 'ms',
              timestamp: new Date(),
              metadata: {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
                firstPaint: navEntry.responseEnd - navEntry.fetchStart,
                transferSize: navEntry.transferSize,
              },
            });
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      logger.warn('Failed to setup navigation observer', { error });
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric({
              name: `resource_load_${this.getResourceType(resourceEntry.name)}`,
              type: MetricType.LOAD_TIME,
              value: resourceEntry.responseEnd - resourceEntry.startTime,
              unit: 'ms',
              timestamp: new Date(),
              metadata: {
                url: resourceEntry.name,
                transferSize: resourceEntry.transferSize,
                type: this.getResourceType(resourceEntry.name),
              },
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      logger.warn('Failed to setup resource observer', { error });
    }

    // Long task detection
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') {
            this.recordMetric({
              name: 'long_task',
              type: MetricType.RENDER_TIME,
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(),
              metadata: {
                startTime: entry.startTime,
                attribution: (entry as any).attribution,
              },
            });
            
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      logger.warn('Failed to setup long task observer', { error });
    }
  }

  private setupWebVitals(): void {
    if (!this.enabled) return;

    // First Contentful Paint
    this.observeWebVital('first-contentful-paint', (value) => {
      this.recordMetric({
        name: 'first_contentful_paint',
        type: MetricType.RENDER_TIME,
        value,
        unit: 'ms',
        timestamp: new Date(),
      });
    });

    // Largest Contentful Paint
    this.observeWebVital('largest-contentful-paint', (value) => {
      this.recordMetric({
        name: 'largest_contentful_paint',
        type: MetricType.RENDER_TIME,
        value,
        unit: 'ms',
        timestamp: new Date(),
      });
    });

    // Cumulative Layout Shift
    this.observeLayoutShift();
  }

  private observeWebVital(name: string, callback: (value: number) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          callback(lastEntry.startTime);
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn(`Failed to observe ${name}`, { error });
    }
  }

  private observeLayoutShift(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        this.recordMetric({
          name: 'cumulative_layout_shift',
          type: MetricType.RENDER_TIME,
          value: clsValue,
          unit: 'score',
          timestamp: new Date(),
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      logger.warn('Failed to observe layout shift', { error });
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  // Public API
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
    logger.debug(`Timer started: ${name}`);
  }

  endTimer(name: string, type: MetricType = MetricType.USER_INTERACTION): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      type,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
    });

    logger.debug(`Timer ended: ${name}`, { duration });
    return duration;
  }

  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);
    
    // Log to console in development
    logger.logPerformanceMetric(metric.name, metric.value, metric.unit);

    // Send to analytics in production
    if (envConfig.isProd() && envConfig.isAnalyticsEnabled()) {
      this.sendToAnalytics(metric);
    }

    // Warn about poor performance
    this.checkPerformanceThresholds(metric);
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      [MetricType.LOAD_TIME]: 3000, // 3 seconds
      [MetricType.RENDER_TIME]: 100, // 100ms
      [MetricType.API_RESPONSE]: 1000, // 1 second
      [MetricType.USER_INTERACTION]: 50, // 50ms
    };

    const threshold = thresholds[metric.type];
    if (threshold && metric.value > threshold) {
      logger.warn(`Performance threshold exceeded for ${metric.name}`, {
        value: metric.value,
        threshold,
        unit: metric.unit,
      });
    }
  }

  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      // Example analytics endpoint
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      logger.warn('Failed to send performance metric to analytics', { error });
    }
  }

  // Memory usage monitoring
  measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory_usage',
        type: MetricType.MEMORY_USAGE,
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        timestamp: new Date(),
        metadata: {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        },
      });
    }
  }

  // React component performance
  measureComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric({
      name: `component_render_${componentName}`,
      type: MetricType.RENDER_TIME,
      value: renderTime,
      unit: 'ms',
      timestamp: new Date(),
      component: componentName,
    });
  }

  // API call performance
  measureApiCall(url: string, method: string, duration: number, status: number): void {
    this.recordMetric({
      name: `api_call_${method.toLowerCase()}`,
      type: MetricType.API_RESPONSE,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      metadata: {
        url,
        method,
        status,
        success: status >= 200 && status < 300,
      },
    });
  }

  // User interaction performance
  measureUserInteraction(interaction: string, duration: number): void {
    this.recordMetric({
      name: `user_interaction_${interaction}`,
      type: MetricType.USER_INTERACTION,
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      metadata: {
        interaction,
      },
    });
  }

  // Get performance summary
  getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    this.metrics.forEach((metric) => {
      const key = `${metric.type}_${metric.name}`;
      if (!summary[key]) {
        summary[key] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        };
      }

      const stats = summary[key];
      stats.count++;
      stats.total += metric.value;
      stats.min = Math.min(stats.min, metric.value);
      stats.max = Math.max(stats.max, metric.value);
      stats.avg = stats.total / stats.count;
    });

    return summary;
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.timers.clear();
  }
}

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  const measureRender = () => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.measureComponentRender(componentName, renderTime);
  };

  return { measureRender };
}

// HOC for automatic component performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  return function PerformanceMonitoredComponent(props: P) {
    const { measureRender } = usePerformanceMonitor(displayName);

    React.useEffect(() => {
      measureRender();
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (name: string) => performanceMonitor.startTimer(name);
export const endTimer = (name: string, type?: MetricType) => performanceMonitor.endTimer(name, type);
export const measureMemory = () => performanceMonitor.measureMemoryUsage();
export const measureApiCall = (url: string, method: string, duration: number, status: number) =>
  performanceMonitor.measureApiCall(url, method, duration, status);
export const measureUserInteraction = (interaction: string, duration: number) =>
  performanceMonitor.measureUserInteraction(interaction, duration);

export default performanceMonitor;