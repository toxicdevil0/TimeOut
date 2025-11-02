/**
 * Phase 6: Advanced Audit Logging & SIEM Integration
 * 
 * Comprehensive audit trail system for compliance, security monitoring,
 * and incident response with structured logging for SIEM integration.
 */

import { logger } from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Audit Event Categories
 */
export enum AuditCategory {
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  
  // Authentication & Authorization
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  PASSWORD_CHANGE = 'password_change',
  ROLE_CHANGE = 'role_change',
  PERMISSION_GRANT = 'permission_grant',
  PERMISSION_REVOKE = 'permission_revoke',
  
  // Data Access & Modification
  DATA_READ = 'data_read',
  DATA_CREATE = 'data_create',
  DATA_UPDATE = 'data_update',
  DATA_DELETE = 'data_delete',
  BULK_OPERATION = 'bulk_operation',
  
  // System Operations
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  MAINTENANCE_MODE = 'maintenance_mode',
  
  // Security Events
  SECURITY_INCIDENT = 'security_incident',
  RATE_LIMIT_TRIGGERED = 'rate_limit_triggered',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  VULNERABILITY_DETECTED = 'vulnerability_detected',
  
  // API Operations
  API_CALL = 'api_call',
  API_ERROR = 'api_error',
  WEBHOOK_RECEIVED = 'webhook_received',
  INTEGRATION_EVENT = 'integration_event'
}

/**
 * Audit Event Severity Levels
 */
export enum AuditSeverity {
  TRACE = 'trace',     // Detailed tracing information
  DEBUG = 'debug',     // Debug information
  INFO = 'info',       // General information
  NOTICE = 'notice',   // Normal but significant events
  WARNING = 'warning', // Warning conditions
  ERROR = 'error',     // Error conditions
  CRITICAL = 'critical', // Critical conditions
  ALERT = 'alert',     // Action must be taken immediately
  EMERGENCY = 'emergency' // System is unusable
}

/**
 * Audit Event Interface
 */
export interface AuditEvent {
  // Core event information
  eventId: string;
  timestamp: Timestamp;
  category: AuditCategory;
  severity: AuditSeverity;
  
  // User and session context
  userId?: string;
  sessionId?: string;
  impersonatedBy?: string; // For admin impersonation
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  
  // Resource information
  resourceType?: string;
  resourceId?: string;
  resourcePath?: string;
  
  // Event details
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  message: string;
  details?: Record<string, any>;
  
  // Change tracking
  beforeValue?: any;
  afterValue?: any;
  changeFields?: string[];
  
  // Compliance and risk
  complianceFlags?: string[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  sensitiveData?: boolean;
  
  // Technical details
  duration?: number; // milliseconds
  errorCode?: string;
  stackTrace?: string;
  
  // Geo and device information
  location?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: [number, number];
  };
  device?: {
    type?: string;
    os?: string;
    browser?: string;
  };
}

/**
 * Audit Configuration
 */
const AUDIT_CONFIG = {
  // Retention policies
  retention: {
    trace: 7,      // 7 days
    debug: 30,     // 30 days
    info: 90,      // 90 days
    notice: 180,   // 6 months
    warning: 365,  // 1 year
    error: 365,    // 1 year
    critical: 2555, // 7 years
    alert: 2555,   // 7 years
    emergency: 2555 // 7 years
  },
  
  // Real-time streaming
  streaming: {
    enabled: true,
    batchSize: 100,
    flushInterval: 5000 // 5 seconds
  },
  
  // SIEM integration
  siem: {
    enabled: true,
    format: 'CEF', // Common Event Format
    endpoint: process.env.SIEM_ENDPOINT,
    apiKey: process.env.SIEM_API_KEY
  },
  
  // Compliance
  compliance: {
    gdpr: true,
    hipaa: false,
    pci: false,
    sox: false
  }
};

/**
 * Advanced Audit Logger Class
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private eventQueue: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
      AuditLogger.instance.startPeriodicFlush();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async logEvent(eventData: Partial<AuditEvent>): Promise<void> {
    try {
      const event: AuditEvent = {
        eventId: this.generateEventId(),
        timestamp: Timestamp.now(),
        category: eventData.category || AuditCategory.API_CALL,
        severity: eventData.severity || AuditSeverity.INFO,
        action: eventData.action || 'unknown',
        outcome: eventData.outcome || 'success',
        message: eventData.message || 'Audit event logged',
        ...eventData
      };

      // Add to queue for batch processing
      this.eventQueue.push(event);

      // Immediate flush for high-severity events
      if (this.shouldImmediateFlush(event)) {
        await this.flushEvents();
      }

      // Log to Firebase Functions logger
      this.logToFirebase(event);

    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log user authentication event
   */
  async logUserAuth(userId: string, success: boolean, details: Record<string, any> = {}): Promise<void> {
    await this.logEvent({
      category: success ? AuditCategory.AUTH_SUCCESS : AuditCategory.AUTH_FAILURE,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      userId,
      action: success ? 'user_authenticated' : 'authentication_failed',
      outcome: success ? 'success' : 'failure',
      message: success ? 'User successfully authenticated' : 'User authentication failed',
      details,
      riskLevel: success ? 'low' : 'medium',
      sensitiveData: false
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    action: 'read' | 'create' | 'update' | 'delete',
    details: Record<string, any> = {}
  ): Promise<void> {
    const categoryMap = {
      read: AuditCategory.DATA_READ,
      create: AuditCategory.DATA_CREATE,
      update: AuditCategory.DATA_UPDATE,
      delete: AuditCategory.DATA_DELETE
    };

    await this.logEvent({
      category: categoryMap[action],
      severity: action === 'delete' ? AuditSeverity.WARNING : AuditSeverity.INFO,
      userId,
      resourceType,
      resourceId,
      action: `${action}_${resourceType}`,
      outcome: 'success',
      message: `User ${action}d ${resourceType} ${resourceId}`,
      details,
      riskLevel: action === 'delete' ? 'medium' : 'low',
      sensitiveData: this.isSensitiveResource(resourceType)
    });
  }

  /**
   * Log system configuration change
   */
  async logConfigChange(
    userId: string,
    configPath: string,
    beforeValue: any,
    afterValue: any,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      category: AuditCategory.SYSTEM_CONFIG_CHANGE,
      severity: AuditSeverity.NOTICE,
      userId,
      resourceType: 'system_config',
      resourcePath: configPath,
      action: 'config_update',
      outcome: 'success',
      message: `System configuration updated: ${configPath}`,
      beforeValue,
      afterValue,
      changeFields: this.getChangedFields(beforeValue, afterValue),
      details,
      riskLevel: 'medium',
      sensitiveData: true
    });
  }

  /**
   * Log security incident
   */
  async logSecurityIncident(
    type: string,
    severity: AuditSeverity,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      category: AuditCategory.SECURITY_INCIDENT,
      severity,
      action: `security_${type}`,
      outcome: 'failure',
      message: `Security incident detected: ${type}`,
      details,
      riskLevel: severity === AuditSeverity.CRITICAL ? 'critical' : 'high',
      sensitiveData: true
    });
  }

  /**
   * Log API call
   */
  async logApiCall(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    const success = statusCode >= 200 && statusCode < 400;
    
    await this.logEvent({
      category: success ? AuditCategory.API_CALL : AuditCategory.API_ERROR,
      severity: success ? AuditSeverity.TRACE : AuditSeverity.WARNING,
      userId,
      resourcePath: endpoint,
      action: `${method.toLowerCase()}_api`,
      outcome: success ? 'success' : 'failure',
      message: `API ${method} ${endpoint} - ${statusCode}`,
      duration,
      details: {
        ...details,
        statusCode,
        method
      },
      riskLevel: 'low'
    });
  }

  /**
   * Generate comprehensive audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters: {
      userId?: string;
      category?: AuditCategory[];
      severity?: AuditSeverity[];
      resourceType?: string;
    } = {}
  ): Promise<any> {
    try {
      let query = db.collection('audit_events')
        .where('timestamp', '>=', Timestamp.fromDate(startDate))
        .where('timestamp', '<=', Timestamp.fromDate(endDate));

      // Apply filters
      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      if (filters.resourceType) {
        query = query.where('resourceType', '==', filters.resourceType);
      }

      const snapshot = await query.get();
      const events = snapshot.docs.map(doc => doc.data());

      // Generate statistics
      const report = {
        summary: {
          totalEvents: events.length,
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          filters
        },
        statistics: {
          byCategory: this.groupBy(events, 'category'),
          bySeverity: this.groupBy(events, 'severity'),
          byUser: this.groupBy(events.filter(e => e.userId), 'userId'),
          byOutcome: this.groupBy(events, 'outcome'),
          byRiskLevel: this.groupBy(events.filter(e => e.riskLevel), 'riskLevel')
        },
        timeline: this.generateTimeline(events),
        topUsers: this.getTopUsers(events),
        securityEvents: events.filter(e => e.category === AuditCategory.SECURITY_INCIDENT),
        complianceMetrics: this.generateComplianceMetrics(events),
        recommendations: this.generateRecommendations(events)
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate audit report:', error);
      throw error;
    }
  }

  /**
   * Flush events to persistent storage
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Batch write to Firestore
      const batch = db.batch();
      
      eventsToFlush.forEach(event => {
        const docRef = db.collection('audit_events').doc(event.eventId);
        batch.set(docRef, event);
      });

      await batch.commit();

      // Stream to SIEM if enabled
      if (AUDIT_CONFIG.siem.enabled) {
        await this.streamToSiem(eventsToFlush);
      }

      logger.debug(`Flushed ${eventsToFlush.length} audit events`);
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
      logger.error('Failed to flush audit events:', error);
    }
  }

  /**
   * Stream events to SIEM system
   */
  private async streamToSiem(events: AuditEvent[]): Promise<void> {
    try {
      // Convert to CEF format or JSON based on SIEM requirements
      const formattedEvents = events.map(event => this.formatForSiem(event));
      
      // Send to SIEM endpoint (implement based on your SIEM system)
      logger.info('SIEM stream would send events:', formattedEvents.length);
      
    } catch (error) {
      logger.error('Failed to stream to SIEM:', error);
    }
  }

  /**
   * Format event for SIEM consumption
   */
  private formatForSiem(event: AuditEvent): string {
    if (AUDIT_CONFIG.siem.format === 'CEF') {
      // Common Event Format
      return `CEF:0|TimeOut|API|1.0|${event.category}|${event.message}|${this.severityToCef(event.severity)}|` +
             `rt=${event.timestamp.toMillis()} src=${event.ipAddress} suser=${event.userId} ` +
             `act=${event.action} outcome=${event.outcome}`;
    } else {
      // JSON format
      return JSON.stringify(event);
    }
  }

  /**
   * Convert severity to CEF format
   */
  private severityToCef(severity: AuditSeverity): number {
    const mapping = {
      [AuditSeverity.TRACE]: 0,
      [AuditSeverity.DEBUG]: 1,
      [AuditSeverity.INFO]: 2,
      [AuditSeverity.NOTICE]: 3,
      [AuditSeverity.WARNING]: 4,
      [AuditSeverity.ERROR]: 6,
      [AuditSeverity.CRITICAL]: 8,
      [AuditSeverity.ALERT]: 9,
      [AuditSeverity.EMERGENCY]: 10
    };
    return mapping[severity] || 2;
  }

  /**
   * Utility functions
   */
  private shouldImmediateFlush(event: AuditEvent): boolean {
    return event.severity === AuditSeverity.CRITICAL ||
           event.severity === AuditSeverity.ALERT ||
           event.severity === AuditSeverity.EMERGENCY;
  }

  private logToFirebase(event: AuditEvent): void {
    const logData = {
      eventId: event.eventId,
      category: event.category,
      action: event.action,
      userId: event.userId,
      outcome: event.outcome,
      message: event.message
    };

    switch (event.severity) {
      case AuditSeverity.EMERGENCY:
      case AuditSeverity.ALERT:
      case AuditSeverity.CRITICAL:
        logger.error('AUDIT:', logData);
        break;
      case AuditSeverity.ERROR:
        logger.error('AUDIT:', logData);
        break;
      case AuditSeverity.WARNING:
        logger.warn('AUDIT:', logData);
        break;
      default:
        logger.info('AUDIT:', logData);
    }
  }

  private generateEventId(): string {
    return `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isSensitiveResource(resourceType: string): boolean {
    const sensitiveTypes = ['user', 'payment', 'personal_data', 'credentials', 'tokens'];
    return sensitiveTypes.includes(resourceType);
  }

  private getChangedFields(before: any, after: any): string[] {
    const changes: string[] = [];
    const beforeObj = before || {};
    const afterObj = after || {};
    
    const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    
    allKeys.forEach(key => {
      if (beforeObj[key] !== afterObj[key]) {
        changes.push(key);
      }
    });
    
    return changes;
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  private generateTimeline(events: any[]): any[] {
    // Group events by hour
    const timeline = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp.toDate()).toISOString().substring(0, 13);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(timeline)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private getTopUsers(events: any[]): Array<{userId: string, eventCount: number}> {
    const userCounts = this.groupBy(events.filter(e => e.userId), 'userId');
    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, eventCount: count as number }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
  }

  private generateComplianceMetrics(events: any[]): any {
    return {
      dataAccess: events.filter(e => e.category === AuditCategory.DATA_READ).length,
      dataModification: events.filter(e => 
        [AuditCategory.DATA_CREATE, AuditCategory.DATA_UPDATE, AuditCategory.DATA_DELETE].includes(e.category)
      ).length,
      authenticationEvents: events.filter(e => 
        [AuditCategory.AUTH_SUCCESS, AuditCategory.AUTH_FAILURE].includes(e.category)
      ).length,
      securityIncidents: events.filter(e => e.category === AuditCategory.SECURITY_INCIDENT).length,
      sensitiveDataAccess: events.filter(e => e.sensitiveData).length
    };
  }

  private generateRecommendations(events: any[]): string[] {
    const recommendations: string[] = [];
    
    const securityEvents = events.filter(e => e.category === AuditCategory.SECURITY_INCIDENT);
    if (securityEvents.length > 0) {
      recommendations.push('Review security incidents and implement additional protective measures');
    }
    
    const failedAuth = events.filter(e => e.category === AuditCategory.AUTH_FAILURE);
    if (failedAuth.length > 10) {
      recommendations.push('High number of authentication failures detected - consider implementing additional security measures');
    }
    
    return recommendations;
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushEvents();
    }, AUDIT_CONFIG.streaming.flushInterval);
  }

  public async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushEvents();
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance();

/**
 * Helper functions for common audit operations
 */
export const auditUserLogin = (userId: string, success: boolean, ipAddress?: string) => {
  auditLogger.logEvent({
    category: success ? AuditCategory.USER_LOGIN : AuditCategory.AUTH_FAILURE,
    severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    userId,
    ipAddress,
    action: 'user_login',
    outcome: success ? 'success' : 'failure',
    message: success ? 'User logged in successfully' : 'User login failed'
  });
};

export const auditDataAccess = (userId: string, resourceType: string, resourceId: string) => {
  auditLogger.logDataAccess(userId, resourceType, resourceId, 'read');
};

export const auditConfigChange = (userId: string, path: string, before: any, after: any) => {
  auditLogger.logConfigChange(userId, path, before, after);
};

export const auditSecurityIncident = (type: string, details: Record<string, any>) => {
  auditLogger.logSecurityIncident(type, AuditSeverity.CRITICAL, details);
};