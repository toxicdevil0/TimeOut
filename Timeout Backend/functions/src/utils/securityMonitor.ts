/**
 * Phase 6: Advanced Production Hardening - Security Monitoring System
 * 
 * Comprehensive real-time monitoring for:
 * - Authentication failures and suspicious patterns
 * - Rate limiting violations and attack attempts  
 * - Unauthorized access attempts and privilege escalation
 * - System health and performance metrics
 * - Security incident detection and alerting
 */

import { logger } from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Security Event Types for monitoring
 */
export enum SecurityEventType {
  // Authentication Events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure', 
  AUTH_BRUTE_FORCE = 'auth_brute_force',
  TOKEN_INVALID = 'token_invalid',
  TOKEN_EXPIRED = 'token_expired',
  
  // Rate Limiting Events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_WARNING = 'rate_limit_warning',
  SUSPICIOUS_TRAFFIC = 'suspicious_traffic',
  
  // Authorization Events
  ACCESS_DENIED = 'access_denied',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  ADMIN_ACCESS = 'admin_access',
  
  // Security Incidents
  SECURITY_BREACH_ATTEMPT = 'security_breach_attempt',
  MALICIOUS_INPUT = 'malicious_input',
  CORS_VIOLATION = 'cors_violation',
  
  // System Events
  SYSTEM_ERROR = 'system_error',
  PERFORMANCE_ALERT = 'performance_alert',
  HEALTH_CHECK_FAILURE = 'health_check_failure'
}

/**
 * Severity levels for security events
 */
export enum SecuritySeverity {
  INFO = 'info',
  WARNING = 'warning', 
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Security event interface
 */
export interface SecurityEvent {
  eventId: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: Timestamp;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  message: string;
  metadata: Record<string, any>;
  riskScore: number; // 0-100
}

/**
 * Security monitoring configuration
 */
const MONITORING_CONFIG = {
  // Thresholds for alerting
  THRESHOLDS: {
    auth_failures_per_minute: 10,
    rate_limit_violations_per_minute: 5,
    access_denied_per_minute: 8,
    high_risk_score: 75,
    critical_risk_score: 90
  },
  
  // Alert channels
  ALERT_CHANNELS: {
    email: true,
    slack: true,
    sms: false, // For critical alerts only
    webhook: true
  },
  
  // Retention periods
  RETENTION: {
    security_events: 90, // days
    performance_metrics: 30, // days
    audit_logs: 365 // days
  }
};

/**
 * Security Monitoring Class
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventBuffer: SecurityEvent[] = [];
  private alertCooldowns = new Map<string, number>();

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log a security event with monitoring and alerting
   */
  async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        eventId: this.generateEventId(),
        timestamp: Timestamp.now(),
        riskScore: 0,
        metadata: {},
        ...event
      } as SecurityEvent;

      // Calculate risk score
      fullEvent.riskScore = this.calculateRiskScore(fullEvent);

      // Store event in Firestore for persistence
      await this.storeEvent(fullEvent);

      // Add to buffer for real-time analysis
      this.eventBuffer.push(fullEvent);
      
      // Keep buffer size manageable
      if (this.eventBuffer.length > 1000) {
        this.eventBuffer = this.eventBuffer.slice(-500);
      }

      // Check for alert conditions
      await this.checkAlertConditions(fullEvent);

      // Log to Firebase Functions logger
      this.logToFirebase(fullEvent);

    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Calculate risk score based on event characteristics
   */
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;

    // Base scores by event type
    const baseScores: Record<SecurityEventType, number> = {
      [SecurityEventType.AUTH_SUCCESS]: 0,
      [SecurityEventType.AUTH_FAILURE]: 20,
      [SecurityEventType.AUTH_BRUTE_FORCE]: 80,
      [SecurityEventType.TOKEN_INVALID]: 30,
      [SecurityEventType.TOKEN_EXPIRED]: 10,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 40,
      [SecurityEventType.RATE_LIMIT_WARNING]: 15,
      [SecurityEventType.SUSPICIOUS_TRAFFIC]: 60,
      [SecurityEventType.ACCESS_DENIED]: 50,
      [SecurityEventType.PRIVILEGE_ESCALATION]: 90,
      [SecurityEventType.ADMIN_ACCESS]: 25,
      [SecurityEventType.SECURITY_BREACH_ATTEMPT]: 95,
      [SecurityEventType.MALICIOUS_INPUT]: 70,
      [SecurityEventType.CORS_VIOLATION]: 35,
      [SecurityEventType.SYSTEM_ERROR]: 20,
      [SecurityEventType.PERFORMANCE_ALERT]: 15,
      [SecurityEventType.HEALTH_CHECK_FAILURE]: 30
    };

    score = baseScores[event.type] || 0;

    // Increase score for repeated events from same IP
    const recentEvents = this.getRecentEventsByIP(event.ipAddress || '', 300); // 5 minutes
    if (recentEvents.length > 5) {
      score += 20;
    }

    // Increase score for failed admin access
    if (event.endpoint?.includes('/admin') && event.type === SecurityEventType.ACCESS_DENIED) {
      score += 25;
    }

    // Increase score for suspicious user agents
    if (event.userAgent && this.isSuspiciousUserAgent(event.userAgent)) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Store security event in Firestore
   */
  private async storeEvent(event: SecurityEvent): Promise<void> {
    try {
      await db.collection('security_events').doc(event.eventId).set({
        ...event,
        timestamp: event.timestamp
      });
    } catch (error) {
      logger.error('Failed to store security event:', error);
    }
  }

  /**
   * Check alert conditions and trigger alerts if necessary
   */
  private async checkAlertConditions(event: SecurityEvent): Promise<void> {
    // Critical risk score alert
    if (event.riskScore >= MONITORING_CONFIG.THRESHOLDS.critical_risk_score) {
      await this.triggerAlert('critical_risk_event', event, 'CRITICAL');
    }
    
    // High risk score alert
    else if (event.riskScore >= MONITORING_CONFIG.THRESHOLDS.high_risk_score) {
      await this.triggerAlert('high_risk_event', event, 'WARNING');
    }

    // Pattern-based alerts
    await this.checkPatternAlerts(event);
  }

  /**
   * Check for suspicious patterns in recent events
   */
  private async checkPatternAlerts(event: SecurityEvent): Promise<void> {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const recentEvents = this.eventBuffer.filter(e => 
      e.timestamp.toMillis() > fiveMinutesAgo
    );

    // Auth failure pattern
    const authFailures = recentEvents.filter(e => 
      e.type === SecurityEventType.AUTH_FAILURE
    );
    if (authFailures.length >= MONITORING_CONFIG.THRESHOLDS.auth_failures_per_minute * 5) {
      await this.triggerAlert('auth_failure_spike', event, 'ERROR');
    }

    // Rate limiting pattern
    const rateLimitViolations = recentEvents.filter(e => 
      e.type === SecurityEventType.RATE_LIMIT_EXCEEDED
    );
    if (rateLimitViolations.length >= MONITORING_CONFIG.THRESHOLDS.rate_limit_violations_per_minute * 5) {
      await this.triggerAlert('rate_limit_spike', event, 'ERROR');
    }

    // Access denied pattern
    const accessDenied = recentEvents.filter(e => 
      e.type === SecurityEventType.ACCESS_DENIED
    );
    if (accessDenied.length >= MONITORING_CONFIG.THRESHOLDS.access_denied_per_minute * 5) {
      await this.triggerAlert('access_denied_spike', event, 'WARNING');
    }
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(alertType: string, event: SecurityEvent, severity: string): Promise<void> {
    const cooldownKey = `${alertType}_${event.ipAddress || 'unknown'}`;
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();

    // Check cooldown to prevent alert spam
    if (this.alertCooldowns.has(cooldownKey)) {
      const lastAlert = this.alertCooldowns.get(cooldownKey)!;
      if (now - lastAlert < cooldownPeriod) {
        return; // Skip alert due to cooldown
      }
    }

    this.alertCooldowns.set(cooldownKey, now);

    const alert = {
      id: this.generateEventId(),
      type: alertType,
      severity,
      timestamp: new Date().toISOString(),
      event: event,
      message: this.generateAlertMessage(alertType, event)
    };

    // Log alert
    logger.warn('Security Alert Triggered:', alert);

    // Store alert in Firestore
    await db.collection('security_alerts').doc(alert.id).set(alert);

    // Send notifications (implement based on your notification system)
    await this.sendAlertNotifications(alert);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alertType: string, event: SecurityEvent): string {
    const messages: Record<string, string> = {
      'critical_risk_event': `Critical security event detected: ${event.type} with risk score ${event.riskScore}`,
      'high_risk_event': `High-risk security event: ${event.type} from IP ${event.ipAddress}`,
      'auth_failure_spike': `Authentication failure spike detected: Multiple failures from ${event.ipAddress}`,
      'rate_limit_spike': `Rate limiting violations spike: Potential DDoS from ${event.ipAddress}`,
      'access_denied_spike': `Access denied spike: Potential unauthorized access attempts from ${event.ipAddress}`
    };

    return messages[alertType] || `Security alert: ${alertType}`;
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: any): Promise<void> {
    try {
      // Add overall timeout for all alert notifications (10 seconds max)
      await Promise.race([
        this.sendAllNotifications(alert),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Alert notifications timeout')), 10000)
        )
      ]);
    } catch (error) {
      logger.error('Failed to send alert notifications:', error);
    }
  }

  private async sendAllNotifications(alert: any): Promise<void> {
    const { backendEnvConfig } = await import('../config/environment');
    
    // In development mode, just log what would be sent
    if (backendEnvConfig.isDev()) {
      logger.info('🚨 [DEV] Security alert would be sent:', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        emailEnabled: MONITORING_CONFIG.ALERT_CHANNELS.email,
        webhookEnabled: MONITORING_CONFIG.ALERT_CHANNELS.webhook,
        event: {
          type: alert.event?.type,
          ipAddress: alert.event?.ipAddress,
          userId: alert.event?.userId,
          riskScore: alert.event?.riskScore
        }
      });
      return;
    }

    const promises: Promise<void>[] = [];

    // Email notification (implement with your email service)
    if (MONITORING_CONFIG.ALERT_CHANNELS.email) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Webhook notification (implement with your webhook service)
    if (MONITORING_CONFIG.ALERT_CHANNELS.webhook) {
      promises.push(this.sendWebhookAlert(alert));
    }

    // Use allSettled to ensure one failing notification doesn't block others
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }

  /**
   * Send email alert using SendGrid (REAL implementation)
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    try {
      const { backendEnvConfig } = await import('../config/environment');
      
      const apiKey = backendEnvConfig.getSendGridApiKey();
      const fromEmail = backendEnvConfig.getAlertEmailFrom();
      const toEmail = backendEnvConfig.getAlertEmailTo();
      
      // Skip email in development if using placeholder keys
      if (backendEnvConfig.isDev() && (apiKey.includes('placeholder') || !apiKey.startsWith('SG.'))) {
        logger.info('📧 [DEV] Email alert would be sent:', {
          from: fromEmail,
          to: toEmail,
          subject: `🚨 Security Alert: ${alert.type}`,
          message: alert.message
        });
        return;
      }

      if (!apiKey || !fromEmail || !toEmail) {
        logger.warn('⚠️ Email alert configuration incomplete - skipping email');
        return;
      }

      // Add timeout wrapper for SendGrid
      const sgMail = (await import('@sendgrid/mail')).default;
      sgMail.setApiKey(apiKey);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
            <h1>🚨 Security Alert</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2>Alert Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Type:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.type}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Severity:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.severity}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Time:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.timestamp}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">Message:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.message}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">IP Address:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.event?.ipAddress || 'Unknown'}</td></tr>
              <tr><td style="font-weight: bold; padding: 8px; border: 1px solid #ddd;">User ID:</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${alert.event?.userId || 'Anonymous'}</td></tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background: #ffffcc; border-left: 4px solid #ffcc00;">
              <strong>Action Required:</strong> Please investigate this security event immediately.
            </div>
          </div>
          <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
            TimeOut Security System - Generated at ${new Date().toISOString()}
          </div>
        </div>
      `;

      const msg = {
        to: toEmail,
        from: fromEmail,
        subject: `🚨 Security Alert: ${alert.type} (${alert.severity})`,
        html: emailHtml,
        text: `Security Alert: ${alert.type}\nSeverity: ${alert.severity}\nTime: ${alert.timestamp}\nMessage: ${alert.message}\nIP: ${alert.event?.ipAddress || 'Unknown'}`
      };
      
      // Send email with 5 second timeout
      await Promise.race([
        sgMail.send(msg),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout')), 5000)
        )
      ]);
      
      logger.info('✅ Security alert email sent successfully', {
        alertType: alert.type,
        severity: alert.severity,
        to: toEmail
      });
      
    } catch (error) {
      logger.error('❌ Failed to send security alert email:', error);
    }
  }

  /**
   * Send webhook alert to Discord/Slack (REAL implementation)
   */
  private async sendWebhookAlert(alert: any): Promise<void> {
    try {
      const { backendEnvConfig } = await import('../config/environment');
      
      const discordUrl = backendEnvConfig.getSecurityWebhookUrl();
      const slackUrl = backendEnvConfig.getSlackWebhookUrl();
      
      // Skip webhooks in development if using placeholder URLs
      if (backendEnvConfig.isDev() && discordUrl.includes('placeholder')) {
        logger.info('🔗 [DEV] Webhook alert would be sent:', {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          ip: alert.event?.ipAddress,
          userId: alert.event?.userId
        });
        return;
      }

      const promises: Promise<any>[] = [];

      // Send Discord webhook
      if (discordUrl && !discordUrl.includes('placeholder')) {
        promises.push(this.sendDiscordWebhook(discordUrl, alert));
      }

      // Send Slack webhook  
      if (slackUrl && !slackUrl.includes('placeholder')) {
        promises.push(this.sendSlackWebhook(slackUrl, alert));
      }

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      } else {
        logger.info('⚠️ No webhook URLs configured - skipping webhook alerts');
      }
      
    } catch (error) {
      logger.error('❌ Failed to send webhook alerts:', error);
    }
  }

  /**
   * Send Discord webhook
   */
  private async sendDiscordWebhook(webhookUrl: string, alert: any): Promise<void> {
    try {
      const color = alert.severity === 'CRITICAL' ? 0xff0000 : 
                   alert.severity === 'ERROR' ? 0xff6600 : 0xffaa00;

      const payload = {
        content: `🚨 **Security Alert Detected**`,
        embeds: [{
          title: `Security Event: ${alert.type}`,
          color: color,
          fields: [
            { name: "Severity", value: alert.severity, inline: true },
            { name: "Time", value: alert.timestamp, inline: true },
            { name: "IP Address", value: alert.event?.ipAddress || "Unknown", inline: true },
            { name: "User ID", value: alert.event?.userId || "Anonymous", inline: true },
            { name: "Message", value: alert.message, inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "TimeOut Security System"
          }
        }]
      };

      // Add 5 second timeout to webhook call
      const response = await Promise.race([
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Discord webhook timeout')), 5000)
        )
      ]);

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      }

      logger.info('✅ Discord webhook sent successfully');
      
    } catch (error) {
      logger.error('❌ Discord webhook failed:', error);
    }
  }

  /**
   * Send Slack webhook
   */
  private async sendSlackWebhook(webhookUrl: string, alert: any): Promise<void> {
    try {
      const color = alert.severity === 'CRITICAL' ? 'danger' : 
                   alert.severity === 'ERROR' ? 'warning' : 'good';

      const payload = {
        text: `🚨 Security Alert: ${alert.type}`,
        attachments: [{
          color: color,
          fields: [
            { title: "Severity", value: alert.severity, short: true },
            { title: "Time", value: alert.timestamp, short: true },
            { title: "IP Address", value: alert.event?.ipAddress || "Unknown", short: true },
            { title: "User ID", value: alert.event?.userId || "Anonymous", short: true },
            { title: "Message", value: alert.message, short: false }
          ],
          footer: "TimeOut Security System",
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      // Add 5 second timeout to webhook call
      const response = await Promise.race([
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Slack webhook timeout')), 5000)
        )
      ]);

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
      }

      logger.info('✅ Slack webhook sent successfully');
      
    } catch (error) {
      logger.error('❌ Slack webhook failed:', error);
    }
  }

  /**
   * Get recent events by IP address
   */
  private getRecentEventsByIP(ipAddress: string, seconds: number): SecurityEvent[] {
    const cutoff = Date.now() - (seconds * 1000);
    return this.eventBuffer.filter(event => 
      event.ipAddress === ipAddress && 
      event.timestamp.toMillis() > cutoff
    );
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scanner/i,
      /sqlmap/i,
      /nmap/i,
      /curl/i,
      /wget/i,
      /python/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Log event to Firebase Functions logger
   */
  private logToFirebase(event: SecurityEvent): void {
    const logData = {
      eventId: event.eventId,
      type: event.type,
      severity: event.severity,
      riskScore: event.riskScore,
      userId: event.userId,
      ipAddress: event.ipAddress,
      endpoint: event.endpoint,
      message: event.message
    };

    switch (event.severity) {
      case SecuritySeverity.CRITICAL:
        logger.error('CRITICAL SECURITY EVENT:', logData);
        break;
      case SecuritySeverity.ERROR:
        logger.error('Security Event:', logData);
        break;
      case SecuritySeverity.WARNING:
        logger.warn('Security Event:', logData);
        break;
      default:
        logger.info('Security Event:', logData);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get security metrics for dashboard
   */
  async getSecurityMetrics(timeRangeHours: number = 24): Promise<any> {
    const cutoff = Date.now() - (timeRangeHours * 60 * 60 * 1000);
    const recentEvents = this.eventBuffer.filter(event => 
      event.timestamp.toMillis() > cutoff
    );

    const metrics = {
      totalEvents: recentEvents.length,
      eventsByType: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      averageRiskScore: 0,
      highRiskEvents: recentEvents.filter(e => e.riskScore >= 75).length,
      criticalEvents: recentEvents.filter(e => e.riskScore >= 90).length,
      topIpAddresses: this.getTopIpAddresses(recentEvents),
      timeRange: `${timeRangeHours} hours`
    };

    // Count events by type
    recentEvents.forEach(event => {
      metrics.eventsByType[event.type] = (metrics.eventsByType[event.type] || 0) + 1;
      metrics.eventsBySeverity[event.severity] = (metrics.eventsBySeverity[event.severity] || 0) + 1;
    });

    // Calculate average risk score
    if (recentEvents.length > 0) {
      metrics.averageRiskScore = recentEvents.reduce((sum, event) => sum + event.riskScore, 0) / recentEvents.length;
    }

    return metrics;
  }

  /**
   * Get top IP addresses by event count
   */
  private getTopIpAddresses(events: SecurityEvent[]): Array<{ip: string, count: number}> {
    const ipCounts = new Map<string, number>();
    
    events.forEach(event => {
      if (event.ipAddress) {
        ipCounts.set(event.ipAddress, (ipCounts.get(event.ipAddress) || 0) + 1);
      }
    });

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * Helper functions for easy logging
 */
export const logAuthFailure = (userId: string, ipAddress: string, reason: string) => {
  securityMonitor.logSecurityEvent({
    type: SecurityEventType.AUTH_FAILURE,
    severity: SecuritySeverity.WARNING,
    userId,
    ipAddress,
    message: `Authentication failed: ${reason}`,
    metadata: { reason }
  });
};

export const logRateLimitExceeded = (ipAddress: string, endpoint: string, limit: number) => {
  securityMonitor.logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity: SecuritySeverity.ERROR,
    ipAddress,
    endpoint,
    message: `Rate limit exceeded: ${limit} requests`,
    metadata: { limit }
  });
};

export const logAccessDenied = (userId: string, ipAddress: string, endpoint: string, requiredRole: string) => {
  securityMonitor.logSecurityEvent({
    type: SecurityEventType.ACCESS_DENIED,
    severity: SecuritySeverity.WARNING,
    userId,
    ipAddress,
    endpoint,
    message: `Access denied: Insufficient permissions`,
    metadata: { requiredRole }
  });
};

export const logAdminAccess = (userId: string, ipAddress: string, endpoint: string) => {
  securityMonitor.logSecurityEvent({
    type: SecurityEventType.ADMIN_ACCESS,
    severity: SecuritySeverity.INFO,
    userId,
    ipAddress,
    endpoint,
    message: `Admin access granted`,
    metadata: { action: 'admin_access' }
  });
};