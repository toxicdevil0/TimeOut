import { Timestamp } from "firebase-admin/firestore";
import { BaseDocument } from "./index";

export interface User extends BaseDocument {
  clerkId: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  lastActive: Timestamp;
  clerkMetadata?: ClerkUserMetadata;
}

export interface UserData {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  deletedAt?: Date;
  studyStats: UserStudyStats;
  preferences: UserPreferences;
  scheduleData?: UserScheduleData;
}

export interface UserScheduleData {
  events: ScheduleEvent[];
  templates: ScheduleTemplate[];
  preferences: SchedulePreferences;
  lastSyncAt: Date;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  resourceId: string;
  bgColor?: string;
  color?: string;
  type: 'study' | 'break' | 'meeting' | 'focus';
  description?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  color?: string;
  events: TemplateEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateEvent {
  title: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  resourceId: string;
  type: 'study' | 'break' | 'meeting' | 'focus';
  description?: string;
  location?: string;
  bgColor?: string;
}

export interface SchedulePreferences {
  defaultView: 'week' | 'day' | 'month';
  workingHours: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  autoSyncEnabled: boolean;
  conflictWarningsEnabled: boolean;
  dailyLimitEnabled: boolean;
  maxEventsPerDay: number;
}

export interface UserStudyStats {
  totalStudyTime: number; // in minutes
  sessionsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number; // in minutes
  weeklyProgress: number; // in minutes
}

export interface UserPreferences {
  defaultFocusTime: number; // in minutes
  shortBreakTime: number; // in minutes
  longBreakTime: number; // in minutes
  sessionsBeforeLongBreak: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export type UserRole = "student" | "teacher" | "admin";

export interface ClerkUserMetadata {
  lastSignInAt?: number;
  emailVerified: boolean;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateUserData {
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  role?: UserRole;
  lastActive?: Timestamp;
}
