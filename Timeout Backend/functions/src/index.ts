/**
 * TimeOut Backend - Firebase Cloud Functions
 * Main entry point for all Cloud Functions
 */

// Import Firebase Functions
import * as functions from "firebase-functions";

// Import configuration
import "./config/firebase"; // Initialize Firebase Admin

// Import function modules
// import * as clerkWebhooks from "./webhooks/clerk"; // Temporarily disabled - missing file
import * as userCallables from "./callable/user";
import * as roomCallables from "./callable/room";
import * as digitalDetoxCallables from "./callable/digitalDetox";
import * as communityCallables from "./callable/community";

// Health check endpoint
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// API endpoint placeholder
export const api = functions.https.onRequest((req, res) => {
  res.status(200).json({
    message: "TimeOut Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      webhooks: "/webhooks/*",
      callable: [
        "updateUserRole",
        "getUserProfile", 
        "updateUserPreferences",
        "updateStudyStats",
        "createRoom",
        "joinRoom", 
        "leaveRoom",
        "getPublicRooms",
        "getRoomDetails",
        "updateParticipantStatus",
        "createAppRestriction",
        "startFocusSession",
        "endFocusSession",
        "getUserRestrictions", 
        "getFocusAnalytics",
        "updateDigitalWellbeing",
        "recordBlockedUsage"
      ],
    },
  });
});

// Export Clerk webhook functions (temporarily disabled - missing webhook file)
// export const clerkWebhook = clerkWebhooks.clerkWebhook;

// Export user callable functions
export const updateUserRole = userCallables.updateUserRole;
export const getUserProfile = userCallables.getUserProfile;
export const updateUserPreferences = userCallables.updateUserPreferences;
export const updateStudyStats = userCallables.updateStudyStats;

// Export room callable functions
export const createRoom = roomCallables.createRoom;
export const joinRoom = roomCallables.joinRoom;
export const leaveRoom = roomCallables.leaveRoom;
export const getPublicRooms = roomCallables.getPublicRooms;
export const getRoomDetails = roomCallables.getRoomDetails;
export const updateParticipantStatus = roomCallables.updateParticipantStatus;

// Export digital detox callable functions
export const createAppRestriction = digitalDetoxCallables.createAppRestriction;
export const startFocusSession = digitalDetoxCallables.startFocusSession;
export const endFocusSession = digitalDetoxCallables.endFocusSession;
export const getUserRestrictions = digitalDetoxCallables.getUserRestrictions;
export const getFocusAnalytics = digitalDetoxCallables.getFocusAnalytics;
export const updateDigitalWellbeing = digitalDetoxCallables.updateDigitalWellbeing;
export const recordBlockedUsage = digitalDetoxCallables.recordBlockedUsage;

// Export community callable functions
export const createStudyCheckIn = communityCallables.createStudyCheckIn;
export const submitPhotoVerification = communityCallables.submitPhotoVerification;
export const votePhotoVerification = communityCallables.votePhotoVerification;
export const getLeaderboard = communityCallables.getLeaderboard;
export const getUserAchievements = communityCallables.getUserAchievements;
export const createStudyGroup = communityCallables.createStudyGroup;
