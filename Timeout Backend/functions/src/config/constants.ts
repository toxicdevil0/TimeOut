// Application constants and configuration
import { backendEnvConfig } from './environment';

// Clerk configuration - use environment config
export const CLERK_WEBHOOK_SECRET = backendEnvConfig.getClerkWebhookSecret();
export const CLERK_SECRET_KEY = backendEnvConfig.getClerkSecretKey();
export const CLERK_PUBLISHABLE_KEY = backendEnvConfig.getClerkPublishableKey();

export const APP_CONFIG = {
  // Room settings - from environment
  ROOM_EXPIRY_HOURS: backendEnvConfig.getRoomExpiryHours(),
  MAX_ROOM_MEMBERS: backendEnvConfig.getMaxRoomMembers(),
  SESSION_TIMEOUT_MINUTES: backendEnvConfig.getSessionTimeoutMinutes(),
  
  // Timer settings
  MIN_TIMER_DURATION: 5, // 5 minutes
  MAX_TIMER_DURATION: 480, // 8 hours
  TIMER_UPDATE_INTERVAL: 1000, // 1 second
  
  // User roles
  USER_ROLES: {
    STUDENT: "student",
    TEACHER: "teacher",
    ADMIN: "admin",
  } as const,
  
  // Room visibility
  ROOM_VISIBILITY: {
    PUBLIC: "public",
    PRIVATE: "private",
  } as const,
  
  // Room status
  ROOM_STATUS: {
    WAITING: "waiting",
    ACTIVE: "active", 
    PAUSED: "paused",
    COMPLETED: "completed",
  } as const,
  
  // Collection names
  COLLECTIONS: {
    USERS: "users",
    STUDY_ROOMS: "studyRooms",
    SESSIONS: "sessions",
    MESSAGES: "messages",
  } as const,
  
  // Error messages
  ERRORS: {
    UNAUTHORIZED: "Unauthorized access",
    ROOM_NOT_FOUND: "Study room not found",
    ROOM_FULL: "Study room is at capacity",
    INVALID_TIMER: "Invalid timer operation",
    PERMISSION_DENIED: "Permission denied",
  } as const,

  // Security settings
  SECURITY: {
    RATE_LIMIT_REQUESTS_PER_MINUTE: backendEnvConfig.getRateLimitRequestsPerMinute(),
    CORS_ALLOWED_ORIGINS: backendEnvConfig.getCorsAllowedOrigins(),
    JWT_VERIFY_STRICT: backendEnvConfig.shouldVerifyJwtStrict(),
  } as const,

  // Monitoring settings
  MONITORING: {
    DETAILED_LOGGING: backendEnvConfig.isDetailedLoggingEnabled(),
    METRICS_ENABLED: backendEnvConfig.isMetricsEnabled(),
    SENTRY_DSN: backendEnvConfig.getSentryDsn(),
  } as const,

  // Database settings
  DATABASE: {
    RETRY_CONFIG: backendEnvConfig.getFirestoreRetryConfig(),
    CACHE_ENABLED: backendEnvConfig.isFirestoreCacheEnabled(),
  } as const,
} as const;

// Export type for APP_CONFIG
export type AppConfig = typeof APP_CONFIG;
