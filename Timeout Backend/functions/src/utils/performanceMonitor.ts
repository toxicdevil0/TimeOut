/**
 * Phase 6: Performance Monitoring & Optimization System
 * 
 * Comprehensive performance monitoring with real-time metrics,
 * automated alerts, and optimization recommendations for production scalability.
 */

import { logger } from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Performance Metric Types
 */
export enum MetricType {
  // Response Time Metrics
  API_RESPONSE_TIME = 'api_response_time',
  DATABASE_QUERY_TIME = 'database_query_time',
  FUNCTION_EXECUTION_TIME = 'function_execution_time',
  
  // Throughput Metrics
  REQUESTS_PER_SECOND = 'requests_per_second',
  TRANSACTIONS_PER_SECOND = 'transactions_per_second',
  CONCURRENT_USERS = 'concurrent_users',
  
  // Resource Utilization
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  FIRESTORE_READS = 'firestore_reads',
  FIRESTORE_WRITES = 'firestore_writes',
  
  // Error Rates
  ERROR_RATE = 'error_rate',
  TIMEOUT_RATE = 'timeout_rate',
  RETRY_RATE = 'retry_rate',
  
  // User Experience
  PAGE_LOAD_TIME = 'page_load_time',
  TIME_TO_FIRST_BYTE = 'time_to_first_byte',
  CORE_WEB_VITALS = 'core_web_vitals',
  
  // Business Metrics
  USER_SESSION_DURATION = 'user_session_duration',
  FEATURE_USAGE = 'feature_usage',
  CONVERSION_RATE = 'conversion_rate'
}

/**
 * Performance Alert Severity
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Performance Metric Interface
 */
export interface PerformanceMetric {
  id: string;
  timestamp: Timestamp;
  type: MetricType;
  value: number;
  unit: string;
  
  // Context information
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  
  // Dimensional data
  dimensions: Record<string, string>;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Performance Alert Interface
 */
export interface PerformanceAlert {
  id: string;
  timestamp: Timestamp;
  severity: AlertSeverity;
  metricType: MetricType;
  threshold: number;
  actualValue: number;
  message: string;
  resolved: boolean;
  resolvedAt?: Timestamp;
}

/**
 * Performance Thresholds Configuration
 */
const PERFORMANCE_THRESHOLDS = {
  // Response time thresholds (milliseconds)
  response_time: {
    warning: 1000,   // 1 second
    critical: 3000   // 3 seconds
  },
  
  // Database query thresholds (milliseconds)
  database_query: {
    warning: 500,    // 500ms
    critical: 2000   // 2 seconds
  },
  
  // Error rate thresholds (percentage)
  error_rate: {
    warning: 1,      // 1%
    critical: 5      // 5%
  },
  
  // Memory usage thresholds (percentage)
  memory_usage: {
    warning: 80,     // 80%
    critical: 95     // 95%
  },
  
  // Throughput thresholds
  requests_per_second: {
    warning: 1000,   // 1000 RPS
    critical: 2000   // 2000 RPS
  }
};

/**
 * Performance Monitoring System
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsBuffer: PerformanceMetric[] = [];
  private activeAlerts = new Map<string, PerformanceAlert>();
  private flushTimer?: NodeJS.Timeout;

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
      PerformanceMonitor.instance.startPeriodicFlush();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: Partial<PerformanceMetric>): Promise<void> {
    try {
      const fullMetric: PerformanceMetric = {
        id: this.generateMetricId(),
        timestamp: Timestamp.now(),
        type: metric.type || MetricType.API_RESPONSE_TIME,
        value: metric.value || 0,
        unit: metric.unit || 'ms',
        dimensions: metric.dimensions || {},
        ...metric
      };

      // Add to buffer
      this.metricsBuffer.push(fullMetric);

      // Check for alert conditions
      await this.checkAlertConditions(fullMetric);

      // Limit buffer size
      if (this.metricsBuffer.length > 10000) {
        this.metricsBuffer = this.metricsBuffer.slice(-5000);
      }

    } catch (error) {
      logger.error('Failed to record performance metric:', error);
    }
  }

  /**
   * Measure and record API response time
   */
  measureApiResponse<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.measureOperation(operation, {
      type: MetricType.API_RESPONSE_TIME,
      endpoint,
      dimensions: { endpoint }
    });
  }

  /**
   * Measure and record database query time
   */
  measureDatabaseQuery<T>(
    queryType: string,
    collection: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.measureOperation(operation, {
      type: MetricType.DATABASE_QUERY_TIME,
      dimensions: { queryType, collection }
    });
  }

  /**
   * Measure and record function execution time
   */
  measureFunction<T>(
    functionName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.measureOperation(operation, {
      type: MetricType.FUNCTION_EXECUTION_TIME,
      dimensions: { functionName }
    });
  }

  /**
   * Generic operation measurement
   */
  private async measureOperation<T>(
    operation: () => Promise<T>,
    metricOptions: Partial<PerformanceMetric>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      await this.recordMetric({
        ...metricOptions,
        value: duration,
        unit: 'ms'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.recordMetric({
        ...metricOptions,
        value: duration,
        unit: 'ms',
        metadata: { error: true }
      });
      
      throw error;
    }
  }

  /**
   * Record error rate metric
   */
  async recordErrorRate(endpoint: string, totalRequests: number, errors: number): Promise<void> {
    const errorRate = (errors / totalRequests) * 100;
    
    await this.recordMetric({
      type: MetricType.ERROR_RATE,
      value: errorRate,
      unit: 'percent',
      endpoint,
      dimensions: { endpoint },
      metadata: { totalRequests, errors }
    });
  }

  /**
   * Record throughput metric
   */
  async recordThroughput(requestsPerSecond: number, endpoint?: string): Promise<void> {
    await this.recordMetric({
      type: MetricType.REQUESTS_PER_SECOND,
      value: requestsPerSecond,
      unit: 'rps',
      endpoint,
      dimensions: { endpoint: endpoint || 'all' }
    });
  }

  /**
   * Record resource usage
   */
  async recordResourceUsage(memoryUsage: number, cpuUsage?: number): Promise<void> {
    await this.recordMetric({
      type: MetricType.MEMORY_USAGE,
      value: memoryUsage,
      unit: 'percent',
      dimensions: { resource: 'memory' }
    });

    if (cpuUsage !== undefined) {
      await this.recordMetric({
        type: MetricType.CPU_USAGE,
        value: cpuUsage,
        unit: 'percent',
        dimensions: { resource: 'cpu' }
      });
    }
  }

  /**
   * Check alert conditions and trigger alerts
   */
  private async checkAlertConditions(metric: PerformanceMetric): Promise<void> {
    const thresholds = this.getThresholds(metric.type);
    if (!thresholds) return;

    const alertKey = `${metric.type}_${metric.endpoint || 'global'}`;
    
    // Check if metric exceeds thresholds
    if (metric.value >= thresholds.critical) {
      await this.triggerAlert(alertKey, metric, AlertSeverity.CRITICAL, thresholds.critical);
    } else if (metric.value >= thresholds.warning) {
      await this.triggerAlert(alertKey, metric, AlertSeverity.HIGH, thresholds.warning);
    } else {
      // Resolve alert if metric is back to normal
      await this.resolveAlert(alertKey);
    }
  }

  /**
   * Get performance thresholds for metric type
   */
  private getThresholds(metricType: MetricType): { warning: number; critical: number } | null {
    switch (metricType) {
      case MetricType.API_RESPONSE_TIME:
        return PERFORMANCE_THRESHOLDS.response_time;
      case MetricType.DATABASE_QUERY_TIME:
        return PERFORMANCE_THRESHOLDS.database_query;
      case MetricType.ERROR_RATE:
        return PERFORMANCE_THRESHOLDS.error_rate;
      case MetricType.MEMORY_USAGE:
        return PERFORMANCE_THRESHOLDS.memory_usage;
      case MetricType.REQUESTS_PER_SECOND:
        return PERFORMANCE_THRESHOLDS.requests_per_second;
      default:
        return null;
    }
  }

  /**
   * Trigger performance alert
   */
  private async triggerAlert(
    alertKey: string,
    metric: PerformanceMetric,
    severity: AlertSeverity,
    threshold: number
  ): Promise<void> {
    // Check if alert already exists
    if (this.activeAlerts.has(alertKey)) {
      return; // Don't spam alerts
    }

    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      timestamp: Timestamp.now(),
      severity,
      metricType: metric.type,
      threshold,
      actualValue: metric.value,
      message: this.generateAlertMessage(metric, threshold),
      resolved: false
    };

    this.activeAlerts.set(alertKey, alert);

    // Store alert in Firestore
    await db.collection('performance_alerts').doc(alert.id).set(alert);

    // Log alert
    logger.warn('Performance Alert:', {
      id: alert.id,
      severity: alert.severity,
      metric: metric.type,
      threshold,
      actual: metric.value,
      message: alert.message
    });

    // Send notifications
    await this.sendAlertNotification(alert);
  }

  /**
   * Resolve performance alert
   */
  private async resolveAlert(alertKey: string): Promise<void> {
    const alert = this.activeAlerts.get(alertKey);
    if (!alert || alert.resolved) return;

    alert.resolved = true;
    alert.resolvedAt = Timestamp.now();

    // Update in Firestore
    await db.collection('performance_alerts').doc(alert.id).update({
      resolved: true,
      resolvedAt: alert.resolvedAt
    });

    this.activeAlerts.delete(alertKey);

    logger.info('Performance Alert Resolved:', { id: alert.id });
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(metric: PerformanceMetric, threshold: number): string {
    const metricName = metric.type.replace(/_/g, ' ');
    return `${metricName} exceeded threshold: ${metric.value}${metric.unit} > ${threshold}${metric.unit}`;
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: PerformanceAlert): Promise<void> {
    try {
      // Implement notification logic (email, Slack, etc.)
      logger.info('Performance alert notification would be sent:', {
        severity: alert.severity,
        message: alert.message
      });
    } catch (error) {
      logger.error('Failed to send performance alert notification:', error);
    }
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData(timeRangeHours: number = 24): Promise<any> {
    const cutoffTime = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    const recentMetrics = this.metricsBuffer.filter(m => 
      m.timestamp.toMillis() > cutoffTime
    );

    return {
      summary: {
        totalMetrics: recentMetrics.length,
        timeRange: `${timeRangeHours} hours`,
        activeAlerts: Array.from(this.activeAlerts.values()).filter(a => !a.resolved).length
      },
      
      responseTime: {
        average: this.calculateAverage(recentMetrics, MetricType.API_RESPONSE_TIME),
        p95: this.calculatePercentile(recentMetrics, MetricType.API_RESPONSE_TIME, 95),
        p99: this.calculatePercentile(recentMetrics, MetricType.API_RESPONSE_TIME, 99)
      },
      
      throughput: {
        requestsPerSecond: this.calculateAverage(recentMetrics, MetricType.REQUESTS_PER_SECOND),
        peakRps: this.calculateMax(recentMetrics, MetricType.REQUESTS_PER_SECOND)
      },
      
      errorRates: {
        overall: this.calculateAverage(recentMetrics, MetricType.ERROR_RATE),
        byEndpoint: this.groupMetricsByDimension(recentMetrics, MetricType.ERROR_RATE, 'endpoint')
      },
      
      resourceUsage: {
        memory: this.calculateAverage(recentMetrics, MetricType.MEMORY_USAGE),
        cpu: this.calculateAverage(recentMetrics, MetricType.CPU_USAGE)
      },
      
      topEndpoints: this.getTopEndpoints(recentMetrics),
      recentAlerts: Array.from(this.activeAlerts.values()).slice(-10),
      recommendations: this.generateOptimizationRecommendations(recentMetrics)
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    const avgResponseTime = this.calculateAverage(metrics, MetricType.API_RESPONSE_TIME);
    if (avgResponseTime > 1000) {
      recommendations.push('API response time is high - consider optimizing database queries and adding caching');
    }
    
    const avgErrorRate = this.calculateAverage(metrics, MetricType.ERROR_RATE);
    if (avgErrorRate > 1) {
      recommendations.push('Error rate is elevated - review recent deployments and error logs');
    }
    
    const avgMemoryUsage = this.calculateAverage(metrics, MetricType.MEMORY_USAGE);
    if (avgMemoryUsage > 80) {
      recommendations.push('Memory usage is high - consider optimizing data structures and garbage collection');
    }
    
    const dbQueries = metrics.filter(m => m.type === MetricType.DATABASE_QUERY_TIME);
    const slowQueries = dbQueries.filter(q => q.value > 500);
    if (slowQueries.length > dbQueries.length * 0.1) {
      recommendations.push('Slow database queries detected - review indexes and query optimization');
    }
    
    return recommendations;
  }

  /**
   * Utility functions for metric calculations
   */
  private calculateAverage(metrics: PerformanceMetric[], type: MetricType): number {
    const filtered = metrics.filter(m => m.type === type);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  private calculatePercentile(metrics: PerformanceMetric[], type: MetricType, percentile: number): number {
    const filtered = metrics.filter(m => m.type === type).map(m => m.value).sort((a, b) => a - b);
    if (filtered.length === 0) return 0;
    const index = Math.floor((percentile / 100) * filtered.length);
    return filtered[index] || 0;
  }

  private calculateMax(metrics: PerformanceMetric[], type: MetricType): number {
    const filtered = metrics.filter(m => m.type === type);
    if (filtered.length === 0) return 0;
    return Math.max(...filtered.map(m => m.value));
  }

  private groupMetricsByDimension(
    metrics: PerformanceMetric[], 
    type: MetricType, 
    dimension: string
  ): Record<string, number> {
    const filtered = metrics.filter(m => m.type === type);
    const grouped = filtered.reduce((acc, metric) => {
      const key = metric.dimensions[dimension] || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate averages
    return Object.entries(grouped).reduce((acc, [key, values]) => {
      acc[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopEndpoints(metrics: PerformanceMetric[]): Array<{endpoint: string, requests: number, avgResponseTime: number}> {
    const endpointMetrics = metrics.filter(m => m.endpoint && m.type === MetricType.API_RESPONSE_TIME);
    
    const endpointGroups = endpointMetrics.reduce((acc, metric) => {
      const endpoint = metric.endpoint!;
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, totalTime: 0 };
      }
      acc[endpoint].count++;
      acc[endpoint].totalTime += metric.value;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    return Object.entries(endpointGroups)
      .map(([endpoint, data]) => ({
        endpoint,
        requests: data.count,
        avgResponseTime: data.totalTime / data.count
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  /**
   * Flush metrics to persistent storage
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Batch write to Firestore
      const batch = db.batch();
      
      metricsToFlush.forEach(metric => {
        const docRef = db.collection('performance_metrics').doc(metric.id);
        batch.set(docRef, metric);
      });

      await batch.commit();
      logger.debug(`Flushed ${metricsToFlush.length} performance metrics`);
    } catch (error) {
      // Re-queue metrics on failure
      this.metricsBuffer.unshift(...metricsToFlush);
      logger.error('Failed to flush performance metrics:', error);
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushMetrics();
    }, 30000); // Flush every 30 seconds
  }

  private generateMetricId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushMetrics();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Decorator for automatic performance monitoring
 */
export function MonitorPerformance(metricType: MetricType = MetricType.FUNCTION_EXECUTION_TIME) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureFunction(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}

/**
 * Helper functions for common performance monitoring
 */
export const monitorApiCall = (endpoint: string, operation: () => Promise<any>) => {
  return performanceMonitor.measureApiResponse(endpoint, operation);
};

export const monitorDatabaseQuery = (queryType: string, collection: string, operation: () => Promise<any>) => {
  return performanceMonitor.measureDatabaseQuery(queryType, collection, operation);
};

export const recordError = (endpoint: string) => {
  performanceMonitor.recordErrorRate(endpoint, 1, 1);
};

export const recordSuccess = (endpoint: string) => {
  performanceMonitor.recordErrorRate(endpoint, 1, 0);
};