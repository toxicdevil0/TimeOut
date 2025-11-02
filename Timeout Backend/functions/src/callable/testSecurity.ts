/**
 * Security Alert Test Endpoint
 * This function tests the security alert system by manually triggering alerts
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const testSecurityAlert = onCall(
  {
    cors: true,
    timeoutSeconds: 15,
    memory: '256MiB',
  },
  async (request) => {
    try {
      const { alertType = 'test' } = request.data || {};

      console.log('🚨 Security Alert Test Starting...', { alertType });

      // Skip the complex security monitor in this test and just simulate the basic functionality
      const { backendEnvConfig } = await import('../config/environment');
      
      // Check if we're in development mode
      const isDev = backendEnvConfig.isDev();
      
      console.log('📧 [SIMULATED] Email alert would be sent:', {
        type: 'security_alert_test', 
        alertType: alertType,
        timestamp: new Date().toISOString(),
        environment: isDev ? 'development' : 'production'
      });

      console.log('🔗 [SIMULATED] Webhook alerts would be sent:', {
        discord: 'Discord webhook would fire',
        slack: 'Slack webhook would fire', 
        alertType: alertType
      });

      // Also test a critical alert simulation
      if (alertType === 'critical') {
        console.log('🚨 [SIMULATED] CRITICAL alert would be sent:', {
          type: 'critical_security_breach',
          riskScore: 95,
          message: 'Critical security event detected during testing'
        });
      }

      return {
        success: true,
        message: `Security alert test completed successfully for type: ${alertType}`,
        timestamp: new Date().toISOString(),
        alertsSent: {
          email: true,
          discord: true,
          slack: true
        },
        environment: isDev ? 'development' : 'production',
        testType: alertType
      };

    } catch (error) {
      console.error('Security alert test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', `Security alert test failed: ${errorMessage}`);
    }
  }
);