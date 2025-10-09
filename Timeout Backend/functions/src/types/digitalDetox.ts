/**
 * Digital Detox Types and Interfaces
 */

export interface AppRestriction {
  id: string;
  userId: string;
  appName: string;
  packageName?: string; // For mobile apps
  websiteUrl?: string; // For websites
  restrictionType: 'complete' | 'scheduled' | 'time_limited';
  allowedTime?: number; // minutes per day for time_limited
  scheduledTimes?: ScheduleSlot[]; // when access is allowed for scheduled
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  days: number[]; // 0-6 for Sunday-Saturday
}

export interface FocusSession {
  id: string;
  userId: string;
  sessionType: 'focus' | 'break' | 'deep_work';
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'interrupted' | 'paused';
  restrictedApps: string[]; // App IDs that are blocked during this session
  allowedApps: string[]; // Emergency apps that remain accessible
  interruptionCount: number;
  productivityScore?: number; // 1-100 calculated based on focus
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusAnalytics {
  userId: string;
  date: string; // YYYY-MM-DD format
  totalFocusTime: number; // minutes
  totalBreakTime: number; // minutes
  sessionsCompleted: number;
  sessionsInterrupted: number;
  appUsageBlocked: AppUsageBlock[];
  focusScore: number; // Daily focus score 1-100
  weeklyAverage: number;
  monthlyAverage: number;
  streakDays: number;
  achievements: Achievement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppUsageBlock {
  appName: string;
  blockedAttempts: number;
  timeWasted: number; // minutes that would have been spent
  category: 'social' | 'entertainment' | 'gaming' | 'news' | 'shopping' | 'other';
}

export interface Achievement {
  id: string;
  type: 'streak' | 'focus_time' | 'sessions' | 'productivity' | 'milestone';
  title: string;
  description: string;
  iconUrl?: string;
  unlockedAt: Date;
  points: number;
}

export interface RestrictionBypass {
  id: string;
  userId: string;
  restrictionId: string;
  reason: string;
  requestedAt: Date;
  approvedAt?: Date;
  deniedAt?: Date;
  approvedBy?: string; // For parent/teacher approval
  duration: number; // minutes of bypass time
  status: 'pending' | 'approved' | 'denied' | 'expired' | 'used';
}

export interface DigitalWellbeing {
  userId: string;
  dailyScreenTimeGoal: number; // minutes
  weeklyFocusGoal: number; // hours
  preferredFocusDuration: number; // minutes (e.g., 25 for Pomodoro)
  preferredBreakDuration: number; // minutes
  bedtimeReminder: boolean;
  bedtime?: string; // HH:mm format
  wakeupTime?: string; // HH:mm format
  enableProgressiveRestriction: boolean;
  emergencyContacts: string[]; // For emergency bypass requests
  parentalControlsEnabled: boolean;
  teacherAccountLinked?: string; // Teacher's user ID for student accounts
  notifications: NotificationSettings;
  updatedAt: Date;
}

export interface NotificationSettings {
  focusReminders: boolean;
  breakReminders: boolean;
  achievementNotifications: boolean;
  weeklyReports: boolean;
  restrictionAlerts: boolean;
  emergencyBypass: boolean;
}

// Request/Response types for API endpoints
export interface CreateRestrictionRequest {
  appName: string;
  packageName?: string;
  websiteUrl?: string;
  restrictionType: 'complete' | 'scheduled' | 'time_limited';
  allowedTime?: number;
  scheduledTimes?: ScheduleSlot[];
}

export interface StartFocusSessionRequest {
  sessionType: 'focus' | 'break' | 'deep_work';
  duration: number;
  restrictedApps?: string[];
  allowedApps?: string[];
}

export interface UpdateWellbeingRequest {
  dailyScreenTimeGoal?: number;
  weeklyFocusGoal?: number;
  preferredFocusDuration?: number;
  preferredBreakDuration?: number;
  bedtimeReminder?: boolean;
  bedtime?: string;
  wakeupTime?: string;
  enableProgressiveRestriction?: boolean;
  notifications?: Partial<NotificationSettings>;
}

export interface RequestBypassRequest {
  restrictionId: string;
  reason: string;
  duration: number;
}

export interface FocusAnalyticsResponse {
  todayStats: FocusAnalytics;
  weeklyTrend: number[];
  monthlyTrend: number[];
  achievements: Achievement[];
  recommendations: string[];
}