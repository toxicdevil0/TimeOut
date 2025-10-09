import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { UserRole, UserData } from '../types/user';

/**
 * Get authenticated user ID from Firebase Auth
 */
function getAuthenticatedUserId(request: CallableRequest): string {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  return request.auth.uid;
}

/**
 * Update user role (called after role selection in frontend)
 */
export const updateUserRole = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { role } = request.data as { role: UserRole };

      if (!role || !['student', 'teacher'].includes(role)) {
        throw new HttpsError('invalid-argument', 'Invalid role provided');
      }

      // Update user role in Firestore
      await db.collection('users').doc(userId).update({
        role,
        updatedAt: new Date(),
      });

      return { success: true, role };
    } catch (error) {
      console.error('Error updating user role:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update user role');
    }
  }
);

/**
 * Get user profile data
 */
export const getUserProfile = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile not found');
      }

      const userData = userDoc.data() as UserData;
      
      // Remove sensitive data before returning
      const { ...publicUserData } = userData;
      
      return publicUserData;
    } catch (error) {
      console.error('Error getting user profile:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get user profile');
    }
  }
);

/**
 * Update user preferences
 */
export const updateUserPreferences = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { preferences } = request.data;

      if (!preferences) {
        throw new HttpsError('invalid-argument', 'Preferences data required');
      }

      // Validate preferences structure
      const validPreferences = {
        defaultFocusTime: preferences.defaultFocusTime || 25,
        shortBreakTime: preferences.shortBreakTime || 5,
        longBreakTime: preferences.longBreakTime || 15,
        sessionsBeforeLongBreak: preferences.sessionsBeforeLongBreak || 4,
        soundEnabled: Boolean(preferences.soundEnabled),
        notificationsEnabled: Boolean(preferences.notificationsEnabled),
        theme: preferences.theme || 'system',
      };

      // Update user preferences in Firestore
      await db.collection('users').doc(userId).update({
        preferences: validPreferences,
        updatedAt: new Date(),
      });

      return { success: true, preferences: validPreferences };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update user preferences');
    }
  }
);

/**
 * Update user study stats
 */
export const updateStudyStats = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { studyTime, sessionCompleted } = request.data;

      if (typeof studyTime !== 'number' || studyTime < 0) {
        throw new HttpsError('invalid-argument', 'Valid study time required');
      }

      // Get current user data
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data() as UserData;
      const currentStats = userData.studyStats;

      // Calculate new stats
      const newStats = {
        totalStudyTime: currentStats.totalStudyTime + studyTime,
        sessionsCompleted: sessionCompleted ? currentStats.sessionsCompleted + 1 : currentStats.sessionsCompleted,
        currentStreak: sessionCompleted ? currentStats.currentStreak + 1 : currentStats.currentStreak,
        longestStreak: Math.max(currentStats.longestStreak, currentStats.currentStreak + (sessionCompleted ? 1 : 0)),
        weeklyGoal: currentStats.weeklyGoal,
        weeklyProgress: currentStats.weeklyProgress + studyTime,
      };

      // Update study stats in Firestore
      await db.collection('users').doc(userId).update({
        studyStats: newStats,
        updatedAt: new Date(),
      });

      return { success: true, studyStats: newStats };
    } catch (error) {
      console.error('Error updating study stats:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update study stats');
    }
  }
);

/**
 * Save user schedule data (events and templates)
 */
export const saveUserSchedule = onCall(
  {
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { events, templates, preferences } = request.data;

      if (!events && !templates && !preferences) {
        throw new HttpsError('invalid-argument', 'At least one of events, templates, or preferences is required');
      }

      // Validate and sanitize the data
      const scheduleData: any = {
        lastSyncAt: new Date(),
      };

      if (events) {
        scheduleData.events = events.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
          updatedAt: new Date(),
        }));
      }

      if (templates) {
        scheduleData.templates = templates.map((template: any) => ({
          ...template,
          createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
          updatedAt: new Date(),
        }));
      }

      if (preferences) {
        scheduleData.preferences = {
          defaultView: preferences.defaultView || 'week',
          workingHours: preferences.workingHours || { start: '08:00', end: '22:00' },
          autoSyncEnabled: Boolean(preferences.autoSyncEnabled !== false),
          conflictWarningsEnabled: Boolean(preferences.conflictWarningsEnabled !== false),
          dailyLimitEnabled: Boolean(preferences.dailyLimitEnabled !== false),
          maxEventsPerDay: preferences.maxEventsPerDay || 4,
        };
      }

      // Update user schedule data in Firestore
      await db.collection('users').doc(userId).update({
        scheduleData,
        updatedAt: new Date(),
      });

      return { success: true, message: 'Schedule data saved successfully' };
    } catch (error) {
      console.error('Error saving user schedule:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to save schedule data');
    }
  }
);

/**
 * Get user schedule data (events and templates)
 */
export const getUserSchedule = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      // Get user data from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data() as UserData;
      
      // Return schedule data or empty defaults
      const scheduleData = userData.scheduleData || {
        events: [],
        templates: [],
        preferences: {
          defaultView: 'week',
          workingHours: { start: '08:00', end: '22:00' },
          autoSyncEnabled: true,
          conflictWarningsEnabled: true,
          dailyLimitEnabled: true,
          maxEventsPerDay: 4,
        },
        lastSyncAt: new Date(),
      };

      return { success: true, scheduleData };
    } catch (error) {
      console.error('Error getting user schedule:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get schedule data');
    }
  }
);

/**
 * Add or update a single event
 */
export const updateUserEvent = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { event, action } = request.data;

      if (!event || !action || !['add', 'update', 'delete'].includes(action)) {
        throw new HttpsError('invalid-argument', 'Valid event and action (add/update/delete) required');
      }

      // Get current user data
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data() as UserData;
      const currentEvents = userData.scheduleData?.events || [];

      let updatedEvents = [...currentEvents];

      if (action === 'add') {
        const newEvent = {
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        updatedEvents.push(newEvent);
      } else if (action === 'update') {
        const eventIndex = updatedEvents.findIndex(e => e.id === event.id);
        if (eventIndex >= 0) {
          updatedEvents[eventIndex] = {
            ...updatedEvents[eventIndex],
            ...event,
            startTime: new Date(event.startTime),
            endTime: new Date(event.endTime),
            updatedAt: new Date(),
          };
        }
      } else if (action === 'delete') {
        updatedEvents = updatedEvents.filter(e => e.id !== event.id);
      }

      // Update the schedule data
      const scheduleData = {
        ...userData.scheduleData,
        events: updatedEvents,
        lastSyncAt: new Date(),
      };

      await db.collection('users').doc(userId).update({
        scheduleData,
        updatedAt: new Date(),
      });

      return { success: true, message: `Event ${action}ed successfully` };
    } catch (error) {
      console.error('Error updating user event:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update event');
    }
  }
);

/**
 * Add or update a single template
 */
export const updateUserTemplate = onCall(
  {
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      // Get authenticated user ID
      const userId = getAuthenticatedUserId(request);

      const { template, action } = request.data;

      if (!template || !action || !['add', 'update', 'delete'].includes(action)) {
        throw new HttpsError('invalid-argument', 'Valid template and action (add/update/delete) required');
      }

      // Get current user data
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found');
      }

      const userData = userDoc.data() as UserData;
      const currentTemplates = userData.scheduleData?.templates || [];

      let updatedTemplates = [...currentTemplates];

      if (action === 'add') {
        const newTemplate = {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        updatedTemplates.push(newTemplate);
      } else if (action === 'update') {
        const templateIndex = updatedTemplates.findIndex(t => t.id === template.id);
        if (templateIndex >= 0) {
          updatedTemplates[templateIndex] = {
            ...updatedTemplates[templateIndex],
            ...template,
            updatedAt: new Date(),
          };
        }
      } else if (action === 'delete') {
        updatedTemplates = updatedTemplates.filter(t => t.id !== template.id);
      }

      // Update the schedule data
      const scheduleData = {
        ...userData.scheduleData,
        templates: updatedTemplates,
        lastSyncAt: new Date(),
      };

      await db.collection('users').doc(userId).update({
        scheduleData,
        updatedAt: new Date(),
      });

      return { success: true, message: `Template ${action}ed successfully` };
    } catch (error) {
      console.error('Error updating user template:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update template');
    }
  }
);
