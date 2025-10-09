/**
 * Community Study Enhancement Types
 */

export interface StudyCheckIn {
  id: string;
  userId: string;
  roomId: string;
  timestamp: Date;
  checkInType: 'photo' | 'verification' | 'progress_update';
  photoUrl?: string;
  isVerified: boolean;
  verifiedBy?: string[];
  studyProgress?: {
    tasksCompleted: number;
    currentTask: string;
    notes?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface StudyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  streakStartDate: string;
  totalStudyDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyMinutes: number;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: 'streak' | 'hours' | 'rooms' | 'verification' | 'community' | 'milestone';
  category: string;
  title: string;
  description: string;
  iconUrl?: string;
  points: number;
  unlockedAt: Date;
  isRare: boolean;
  progress?: {
    current: number;
    required: number;
  };
}

export interface Leaderboard {
  id: string;
  type: 'weekly' | 'monthly' | 'all_time';
  category: 'study_time' | 'streak' | 'rooms_joined' | 'verifications' | 'points';
  timeframe: string; // e.g., "2024-W39" for weekly
  entries: LeaderboardEntry[];
  lastUpdated: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  change: number; // Position change from last period
  badge?: string;
}

export interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  points: number;
  category: 'study' | 'community' | 'achievement' | 'special';
}

export interface BadgeRequirement {
  type: 'study_hours' | 'streak_days' | 'rooms_joined' | 'verifications' | 'social';
  value: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: GroupMember[];
  maxMembers: number;
  isPrivate: boolean;
  tags: string[];
  settings: GroupSettings;
  stats: GroupStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: Date;
  lastActive: Date;
  studyStreak: number;
  contributionScore: number;
}

export interface GroupSettings {
  requireApproval: boolean;
  allowPhotoCheckIns: boolean;
  verificationRequired: boolean;
  minimumSessionTime: number; // minutes
  studySchedule?: WeeklySchedule;
  focusMode: 'strict' | 'moderate' | 'flexible';
  allowedBreakTime: number; // minutes per hour
}

export interface WeeklySchedule {
  [key: string]: TimeSlot[]; // "monday", "tuesday", etc.
}

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subject?: string;
}

export interface GroupStats {
  totalStudyTime: number; // minutes
  averageSessionLength: number; // minutes
  totalSessions: number;
  activeMembers: number;
  checkInsToday: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

export interface VerificationRequest {
  id: string;
  checkInId: string;
  userId: string;
  roomId: string;
  photoUrl: string;
  requestedAt: Date;
  votes: VerificationVote[];
  status: 'pending' | 'approved' | 'rejected';
  requiredVotes: number;
  expiresAt: Date;
}

export interface VerificationVote {
  voterId: string;
  vote: 'approve' | 'reject';
  reason?: string;
  timestamp: Date;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  category: 'study_time' | 'streak' | 'consistency' | 'social';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  participants: string[]; // user IDs
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  progress: Map<string, number>; // userId -> progress
  leaderboard: LeaderboardEntry[];
}

export interface ChallengeRequirement {
  type: 'study_minutes' | 'check_ins' | 'streak_days' | 'group_sessions';
  target: number;
  period: 'daily' | 'weekly' | 'total';
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'title' | 'unlock';
  value: string | number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Request/Response Types
export interface CreateCheckInRequest {
  roomId: string;
  checkInType: 'photo' | 'verification' | 'progress_update';
  photoFile?: File;
  studyProgress?: {
    tasksCompleted: number;
    currentTask: string;
    notes?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface GetLeaderboardRequest {
  type: 'weekly' | 'monthly' | 'all_time';
  category: 'study_time' | 'streak' | 'rooms_joined' | 'verifications' | 'points';
  limit?: number;
}

export interface JoinChallengeRequest {
  challengeId: string;
}

export interface VoteVerificationRequest {
  verificationId: string;
  vote: 'approve' | 'reject';
  reason?: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  maxMembers: number;
  isPrivate: boolean;
  tags: string[];
  settings: Partial<GroupSettings>;
}

export interface UpdateGroupRequest {
  groupId: string;
  updates: Partial<Pick<StudyGroup, 'name' | 'description' | 'maxMembers' | 'isPrivate' | 'tags'>>;
  settings?: Partial<GroupSettings>;
}