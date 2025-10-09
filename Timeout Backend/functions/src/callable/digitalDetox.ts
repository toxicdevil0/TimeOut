import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { 
  AppRestriction, 
  FocusSession, 
  FocusAnalytics, 
  DigitalWellbeing,
  CreateRestrictionRequest,
  StartFocusSessionRequest,
  UpdateWellbeingRequest,
  FocusAnalyticsResponse,
  Achievement
} from '../types/digitalDetox';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Get authenticated user ID from Firebase Auth
 */
function getAuthenticatedUserId(request: CallableRequest): string {
  // In emulator mode, allow manual user ID for testing
  if (process.env.FUNCTIONS_EMULATOR === 'true' && request.data?.userId) {
    return request.data.userId;
  }
  
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  return request.auth.uid;
}

/**
 * Create a new app restriction
 */
export const createAppRestriction = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const {
        appName,
        packageName,
        websiteUrl,
        restrictionType,
        allowedTime,
        scheduledTimes
      } = request.data as CreateRestrictionRequest;

      if (!appName || !restrictionType) {
        throw new HttpsError('invalid-argument', 'App name and restriction type are required');
      }

      const restrictionId = db.collection('appRestrictions').doc().id;
      const restriction: AppRestriction = {
        id: restrictionId,
        userId,
        appName,
        packageName,
        websiteUrl,
        restrictionType,
        allowedTime,
        scheduledTimes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('appRestrictions').doc(restrictionId).set(restriction);

      return { success: true, restrictionId, restriction };
    } catch (error) {
      console.error('Error creating app restriction:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create app restriction');
    }
  }
);

/**
 * Start a focus session
 */
export const startFocusSession = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const {
        sessionType,
        duration,
        restrictedApps = [],
        allowedApps = []
      } = request.data as StartFocusSessionRequest;

      if (!sessionType || !duration) {
        throw new HttpsError('invalid-argument', 'Session type and duration are required');
      }

      // Check if user has an active session
      const activeSessionQuery = await db.collection('focusSessions')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();

      if (!activeSessionQuery.empty) {
        throw new HttpsError('failed-precondition', 'User already has an active focus session');
      }

      const sessionId = db.collection('focusSessions').doc().id;
      const session: FocusSession = {
        id: sessionId,
        userId,
        sessionType,
        duration,
        startTime: new Date(),
        status: 'active',
        restrictedApps,
        allowedApps,
        interruptionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('focusSessions').doc(sessionId).set(session);

      return { success: true, sessionId, session };
    } catch (error) {
      console.error('Error starting focus session:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to start focus session');
    }
  }
);

/**
 * End a focus session
 */
export const endFocusSession = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { sessionId, status = 'completed' } = request.data;

      console.log('🛑 endFocusSession called:', { userId, sessionId, status });

      if (!sessionId) {
        throw new HttpsError('invalid-argument', 'Session ID is required');
      }

      const sessionRef = db.collection('focusSessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        console.error('❌ Session not found:', sessionId);
        throw new HttpsError('not-found', 'Focus session not found');
      }

      const session = sessionDoc.data() as FocusSession;
      console.log('🔍 Found session:', { sessionId, sessionUserId: session.userId, requestUserId: userId, startTime: session.startTime });
      
      if (session.userId !== userId) {
        throw new HttpsError('permission-denied', 'Cannot end another user\'s session');
      }

      const endTime = new Date();
      
      // Handle both Date objects and Firestore Timestamps
      let startTimeMs: number;
      if (session.startTime instanceof Date) {
        console.log('✅ StartTime is Date object');
        startTimeMs = session.startTime.getTime();
      } else if (session.startTime && typeof session.startTime === 'object' && 'toDate' in session.startTime) {
        console.log('✅ StartTime is Firestore Timestamp');
        // Firestore Timestamp
        startTimeMs = (session.startTime as any).toDate().getTime();
      } else {
        console.error('❌ Invalid startTime format:', session.startTime);
        throw new HttpsError('internal', 'Invalid session startTime format');
      }
      
      const actualDuration = Math.floor((endTime.getTime() - startTimeMs) / (1000 * 60));
      const completionRate = Math.min(100, (actualDuration / session.duration) * 100);
      const productivityScore = Math.max(0, Math.min(100, completionRate - (session.interruptionCount * 10)));

      console.log('📊 Session calculations:', { actualDuration, completionRate, productivityScore });

      await sessionRef.update({
        endTime,
        status,
        productivityScore,
        updatedAt: new Date()
      });

      console.log('✅ Session updated in database');

      // Update daily analytics
      await updateDailyAnalytics(userId, session, actualDuration, productivityScore);

      console.log('✅ Analytics updated, session end complete');
      return { success: true, actualDuration, productivityScore };
    } catch (error) {
      console.error('❌ Error ending focus session:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to end focus session');
    }
  }
);

/**
 * Get user's app restrictions
 */
export const getUserRestrictions = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);

      const restrictionsQuery = await db.collection('appRestrictions')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      const restrictions = restrictionsQuery.docs.map(doc => doc.data() as AppRestriction);

      return { success: true, restrictions };
    } catch (error) {
      console.error('Error getting user restrictions:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get user restrictions');
    }
  }
);

/**
 * Get focus analytics
 */
export const getFocusAnalytics = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);

      const today = new Date().toISOString().split('T')[0];
      const analyticsRef = db.collection('focusAnalytics').doc(`${userId}_${today}`);
      const analyticsDoc = await analyticsRef.get();

      let todayStats: FocusAnalytics;
      if (analyticsDoc.exists) {
        todayStats = analyticsDoc.data() as FocusAnalytics;
      } else {
        todayStats = {
          userId,
          date: today,
          totalFocusTime: 0,
          totalBreakTime: 0,
          sessionsCompleted: 0,
          sessionsInterrupted: 0,
          appUsageBlocked: [],
          focusScore: 0,
          weeklyAverage: 0,
          monthlyAverage: 0,
          streakDays: 0,
          achievements: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      // Calculate trends
      const weeklyTrend = await calculateWeeklyTrend(userId);
      const monthlyTrend = await calculateMonthlyTrend(userId);
      const achievements = await getUserAchievements(userId);
      const recommendations = generateRecommendations(todayStats);

      const response: FocusAnalyticsResponse = {
        todayStats,
        weeklyTrend,
        monthlyTrend,
        achievements,
        recommendations
      };

      return { success: true, analytics: response };
    } catch (error) {
      console.error('Error getting focus analytics:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get focus analytics');
    }
  }
);

/**
 * Update digital wellbeing settings
 */
export const updateDigitalWellbeing = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const updates = request.data as UpdateWellbeingRequest;

      const wellbeingRef = db.collection('digitalWellbeing').doc(userId);
      const wellbeingDoc = await wellbeingRef.get();

      let currentSettings: DigitalWellbeing;
      if (wellbeingDoc.exists) {
        currentSettings = wellbeingDoc.data() as DigitalWellbeing;
      } else {
        currentSettings = {
          userId,
          dailyScreenTimeGoal: 180, // 3 hours default
          weeklyFocusGoal: 10, // 10 hours default
          preferredFocusDuration: 25,
          preferredBreakDuration: 5,
          bedtimeReminder: false,
          enableProgressiveRestriction: false,
          emergencyContacts: [],
          parentalControlsEnabled: false,
          notifications: {
            focusReminders: true,
            breakReminders: true,
            achievementNotifications: true,
            weeklyReports: true,
            restrictionAlerts: true,
            emergencyBypass: true
          },
          updatedAt: new Date()
        };
      }

      const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date()
      };

      await wellbeingRef.set(updatedSettings);

      return { success: true, settings: updatedSettings };
    } catch (error) {
      console.error('Error updating digital wellbeing:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update digital wellbeing settings');
    }
  }
);

/**
 * Record app usage attempt (blocked)
 */
export const recordBlockedUsage = onCall(
  {
    timeoutSeconds: 30,
    memory: '128MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { appName, category = 'other' } = request.data;

      if (!appName) {
        throw new HttpsError('invalid-argument', 'App name is required');
      }

      const today = new Date().toISOString().split('T')[0];
      const analyticsRef = db.collection('focusAnalytics').doc(`${userId}_${today}`);

      await analyticsRef.update({
        [`appUsageBlocked.${appName}.blockedAttempts`]: FieldValue.increment(1),
        [`appUsageBlocked.${appName}.appName`]: appName,
        [`appUsageBlocked.${appName}.category`]: category,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error recording blocked usage:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to record blocked usage');
    }
  }
);

// Helper functions
async function updateDailyAnalytics(
  userId: string, 
  session: FocusSession, 
  actualDuration: number, 
  productivityScore: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const analyticsRef = db.collection('focusAnalytics').doc(`${userId}_${today}`);

  const updates: any = {
    updatedAt: new Date()
  };

  if (session.sessionType === 'focus' || session.sessionType === 'deep_work') {
    updates.totalFocusTime = FieldValue.increment(actualDuration);
    if (session.status === 'completed') {
      updates.sessionsCompleted = FieldValue.increment(1);
    } else {
      updates.sessionsInterrupted = FieldValue.increment(1);
    }
  } else if (session.sessionType === 'break') {
    updates.totalBreakTime = FieldValue.increment(actualDuration);
  }

  await analyticsRef.set(updates, { merge: true });
}

async function calculateWeeklyTrend(userId: string): Promise<number[]> {
  const trend: number[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const analyticsDoc = await db.collection('focusAnalytics').doc(`${userId}_${dateStr}`).get();
    if (analyticsDoc.exists) {
      const data = analyticsDoc.data() as FocusAnalytics;
      trend.push(data.totalFocusTime);
    } else {
      trend.push(0);
    }
  }
  
  return trend;
}

async function calculateMonthlyTrend(userId: string): Promise<number[]> {
  const trend: number[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const analyticsDoc = await db.collection('focusAnalytics').doc(`${userId}_${dateStr}`).get();
    if (analyticsDoc.exists) {
      const data = analyticsDoc.data() as FocusAnalytics;
      trend.push(data.totalFocusTime);
    } else {
      trend.push(0);
    }
  }
  
  return trend;
}

async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const achievementsQuery = await db.collection('achievements')
    .where('userId', '==', userId)
    .orderBy('unlockedAt', 'desc')
    .limit(10)
    .get();

  return achievementsQuery.docs.map(doc => doc.data() as Achievement);
}

function generateRecommendations(analytics: FocusAnalytics): string[] {
  const recommendations: string[] = [];
  
  if (analytics.totalFocusTime < 60) {
    recommendations.push('Try to reach at least 1 hour of focused work today');
  }
  
  if (analytics.sessionsInterrupted > analytics.sessionsCompleted) {
    recommendations.push('Consider using stricter app restrictions during focus sessions');
  }
  
  if (analytics.focusScore < 70) {
    recommendations.push('Take shorter focus sessions to build consistency');
  }
  
  if (analytics.totalBreakTime < analytics.totalFocusTime * 0.2) {
    recommendations.push('Remember to take regular breaks to maintain productivity');
  }
  
  return recommendations;
}