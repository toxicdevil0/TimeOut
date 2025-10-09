import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { 
  StudyCheckIn,
  StudyStreak,
  Achievement,
  Leaderboard,
  LeaderboardEntry,
  CommunityBadge,
  StudyGroup,
  VerificationRequest,
  CreateCheckInRequest,
  GetLeaderboardRequest,
  VoteVerificationRequest,
  CreateGroupRequest
} from '../types/community';
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
 * Create a study check-in with photo verification
 */
export const createStudyCheckIn = onCall(
  {
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const {
        roomId,
        checkInType,
        studyProgress,
        location
      } = request.data as CreateCheckInRequest;

      if (!roomId || !checkInType) {
        throw new HttpsError('invalid-argument', 'Room ID and check-in type are required');
      }

      // Verify user is in the room
      const roomRef = db.collection('rooms').doc(roomId);
      const roomDoc = await roomRef.get();
      
      if (!roomDoc.exists) {
        throw new HttpsError('not-found', 'Study room not found');
      }

      const roomData = roomDoc.data();
      const participants = roomData?.participants || {};
      
      if (!participants[userId]) {
        throw new HttpsError('permission-denied', 'Must be a participant in the room to check in');
      }

      const checkInId = db.collection('studyCheckIns').doc().id;
      const checkIn: StudyCheckIn = {
        id: checkInId,
        userId,
        roomId,
        timestamp: new Date(),
        checkInType,
        isVerified: checkInType !== 'photo', // Photos require peer verification
        studyProgress,
        location: location ? { ...location, accuracy: 100 } : undefined
      };

      await db.collection('studyCheckIns').doc(checkInId).set(checkIn);

      // Update user's study streak
      await updateStudyStreak(userId);

      // Award points for check-in
      await awardPoints(userId, 'check_in', 10);

      return { success: true, checkInId, checkIn };
    } catch (error) {
      console.error('Error creating study check-in:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create study check-in');
    }
  }
);

/**
 * Submit photo for peer verification
 */
export const submitPhotoVerification = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const { checkInId, photoUrl } = request.data;

      if (!checkInId || !photoUrl) {
        throw new HttpsError('invalid-argument', 'Check-in ID and photo URL are required');
      }

      // Get the check-in
      const checkInRef = db.collection('studyCheckIns').doc(checkInId);
      const checkInDoc = await checkInRef.get();

      if (!checkInDoc.exists) {
        throw new HttpsError('not-found', 'Check-in not found');
      }

      const checkIn = checkInDoc.data() as StudyCheckIn;
      if (checkIn.userId !== userId) {
        throw new HttpsError('permission-denied', 'Cannot verify another user\'s check-in');
      }

      const verificationId = db.collection('verificationRequests').doc().id;
      const verification: VerificationRequest = {
        id: verificationId,
        checkInId,
        userId,
        roomId: checkIn.roomId,
        photoUrl,
        requestedAt: new Date(),
        votes: [],
        status: 'pending',
        requiredVotes: 3,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      await db.collection('verificationRequests').doc(verificationId).set(verification);

      // Update check-in with photo URL
      await checkInRef.update({
        photoUrl,
        updatedAt: new Date()
      });

      return { success: true, verificationId, verification };
    } catch (error) {
      console.error('Error submitting photo verification:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to submit photo verification');
    }
  }
);

/**
 * Vote on photo verification
 */
export const votePhotoVerification = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const voterId = getAuthenticatedUserId(request);
      const { verificationId, vote, reason } = request.data as VoteVerificationRequest;

      if (!verificationId || !vote) {
        throw new HttpsError('invalid-argument', 'Verification ID and vote are required');
      }

      const verificationRef = db.collection('verificationRequests').doc(verificationId);
      const verificationDoc = await verificationRef.get();

      if (!verificationDoc.exists) {
        throw new HttpsError('not-found', 'Verification request not found');
      }

      const verification = verificationDoc.data() as VerificationRequest;
      
      if (verification.userId === voterId) {
        throw new HttpsError('permission-denied', 'Cannot vote on your own verification');
      }

      if (verification.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Verification is no longer pending');
      }

      // Check if user already voted
      const existingVote = verification.votes.find(v => v.voterId === voterId);
      if (existingVote) {
        throw new HttpsError('failed-precondition', 'You have already voted on this verification');
      }

      // Add the vote
      const newVote = {
        voterId,
        vote,
        reason,
        timestamp: new Date()
      };

      const updatedVotes = [...verification.votes, newVote];
      const approveVotes = updatedVotes.filter(v => v.vote === 'approve').length;
      const rejectVotes = updatedVotes.filter(v => v.vote === 'reject').length;

      let status: 'pending' | 'approved' | 'rejected' = verification.status;
      if (approveVotes >= verification.requiredVotes) {
        status = 'approved';
        // Mark check-in as verified
        await db.collection('studyCheckIns').doc(verification.checkInId).update({
          isVerified: true,
          verifiedBy: updatedVotes.filter(v => v.vote === 'approve').map(v => v.voterId),
          updatedAt: new Date()
        });
        // Award verification points
        await awardPoints(verification.userId, 'verification_approved', 25);
      } else if (rejectVotes >= verification.requiredVotes) {
        status = 'rejected';
      }

      await verificationRef.update({
        votes: updatedVotes,
        status,
        updatedAt: new Date()
      });

      // Award voting points
      await awardPoints(voterId, 'verification_vote', 5);

      return { success: true, status };
    } catch (error) {
      console.error('Error voting on verification:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to vote on verification');
    }
  }
);

/**
 * Get leaderboard data
 */
export const getLeaderboard = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const { type, category, limit = 50 } = request.data as GetLeaderboardRequest;

      if (!type || !category) {
        throw new HttpsError('invalid-argument', 'Type and category are required');
      }

      const timeframe = generateTimeframe(type);
      const leaderboardId = `${type}_${category}_${timeframe}`;

      const leaderboardRef = db.collection('leaderboards').doc(leaderboardId);
      const leaderboardDoc = await leaderboardRef.get();

      let leaderboard: Leaderboard;

      if (leaderboardDoc.exists && isLeaderboardCurrent(leaderboardDoc.data() as Leaderboard)) {
        leaderboard = leaderboardDoc.data() as Leaderboard;
      } else {
        // Generate fresh leaderboard
        leaderboard = await generateLeaderboard(type, category, timeframe, limit);
        await leaderboardRef.set(leaderboard);
      }

      return { 
        success: true, 
        leaderboard: {
          ...leaderboard,
          entries: leaderboard.entries.slice(0, limit)
        }
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get leaderboard');
    }
  }
);

/**
 * Get user achievements and badges
 */
export const getUserAchievements = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);

      const achievementsQuery = await db.collection('achievements')
        .where('userId', '==', userId)
        .orderBy('unlockedAt', 'desc')
        .limit(50)
        .get();

      const achievements = achievementsQuery.docs.map(doc => doc.data() as Achievement);

      // Get available badges that user can earn
      const badgesQuery = await db.collection('communityBadges').get();
      const allBadges = badgesQuery.docs.map(doc => doc.data() as CommunityBadge);

      // Check user progress on unearned badges
      const userStats = await getUserStats(userId);
      const earnedBadgeIds = achievements.map(a => a.id);
      const availableBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

      return { 
        success: true, 
        achievements,
        availableBadges: availableBadges.slice(0, 20), // Limit for performance
        stats: userStats
      };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to get user achievements');
    }
  }
);

/**
 * Create study group
 */
export const createStudyGroup = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request: CallableRequest) => {
    try {
      const userId = getAuthenticatedUserId(request);
      const {
        name,
        description,
        maxMembers,
        isPrivate,
        tags,
        settings
      } = request.data as CreateGroupRequest;

      if (!name || !description) {
        throw new HttpsError('invalid-argument', 'Name and description are required');
      }

      const groupId = db.collection('studyGroups').doc().id;
      const group: StudyGroup = {
        id: groupId,
        name,
        description,
        createdBy: userId,
        members: [{
          userId,
          userName: 'Group Creator', // This should be fetched from user profile
          role: 'owner',
          joinedAt: new Date(),
          lastActive: new Date(),
          studyStreak: 0,
          contributionScore: 0
        }],
        maxMembers: maxMembers || 20,
        isPrivate: isPrivate || false,
        tags: tags || [],
        settings: {
          requireApproval: isPrivate,
          allowPhotoCheckIns: true,
          verificationRequired: false,
          minimumSessionTime: 25,
          focusMode: 'moderate',
          allowedBreakTime: 5,
          ...settings
        },
        stats: {
          totalStudyTime: 0,
          averageSessionLength: 0,
          totalSessions: 0,
          activeMembers: 1,
          checkInsToday: 0,
          weeklyGoal: 0,
          weeklyProgress: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('studyGroups').doc(groupId).set(group);

      return { success: true, groupId, group };
    } catch (error) {
      console.error('Error creating study group:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to create study group');
    }
  }
);

// Helper functions
async function updateStudyStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const streakRef = db.collection('studyStreaks').doc(userId);
  const streakDoc = await streakRef.get();

  let streak: StudyStreak;
  if (streakDoc.exists) {
    streak = streakDoc.data() as StudyStreak;
    
    if (streak.lastStudyDate === today) {
      // Already studied today, no update needed
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (streak.lastStudyDate === yesterdayStr) {
      // Continuing streak
      streak.currentStreak += 1;
    } else {
      // Streak broken, reset
      streak.currentStreak = 1;
      streak.streakStartDate = today;
    }
    
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastStudyDate = today;
    streak.totalStudyDays += 1;
    streak.updatedAt = new Date();
  } else {
    // First time studying
    streak = {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: today,
      streakStartDate: today,
      totalStudyDays: 1,
      weeklyGoal: 5,
      weeklyProgress: 1,
      monthlyMinutes: 0,
      updatedAt: new Date()
    };
  }

  await streakRef.set(streak);
}

async function awardPoints(userId: string, action: string, points: number): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    totalPoints: FieldValue.increment(points),
    [`pointsHistory.${action}`]: FieldValue.increment(points),
    updatedAt: new Date()
  });
}

function generateTimeframe(type: 'weekly' | 'monthly' | 'all_time'): string {
  const now = new Date();
  switch (type) {
    case 'weekly':
      // Get ISO week number
      const weekNumber = getISOWeek(now);
      return `${now.getFullYear()}-W${weekNumber}`;
    case 'monthly':
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    case 'all_time':
      return 'all_time';
    default:
      return 'all_time';
  }
}

function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function isLeaderboardCurrent(leaderboard: Leaderboard): boolean {
  const hoursSinceUpdate = (Date.now() - leaderboard.lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursSinceUpdate < 1; // Update every hour
}

async function generateLeaderboard(
  type: 'weekly' | 'monthly' | 'all_time',
  category: string,
  timeframe: string,
  limit: number
): Promise<Leaderboard> {
  // This is a simplified implementation
  // In practice, you'd query relevant collections and aggregate data
  
  const entries: LeaderboardEntry[] = [];
  // Implementation would depend on the specific category and data structure
  
  return {
    id: `${type}_${category}_${timeframe}`,
    type,
    category: category as any,
    timeframe,
    entries,
    lastUpdated: new Date()
  };
}

async function getUserStats(userId: string): Promise<any> {
  // Aggregate user statistics from various collections
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  return {
    totalPoints: userData?.totalPoints || 0,
    studyStreak: 0, // Would be fetched from studyStreaks collection
    totalStudyTime: 0, // Would be aggregated from sessions
    achievementsCount: 0 // Would be counted from achievements collection
  };
}