import * as admin from "firebase-admin";
import { backendEnvConfig } from "./environment";

// Initialize Firebase Admin SDK with environment-aware configuration
if (!admin.apps.length) {
  const config: admin.AppOptions = {
    credential: admin.credential.applicationDefault(),
    projectId: backendEnvConfig.getFirebaseProjectId(),
  };

  // Add additional configuration for production
  if (backendEnvConfig.isProd()) {
    // Add production-specific configuration if needed
    // e.g., databaseURL, storageBucket, etc.
  }

  admin.initializeApp(config);
}

export const db = admin.firestore();
export const auth = admin.auth();
// export const storage = admin.storage(); // TODO: Enable when storage is set up

// Configure Firestore settings based on environment
const firestoreSettings: admin.firestore.Settings = {
  timestampsInSnapshots: true,
};

// Add performance settings for production
if (backendEnvConfig.isProd()) {
  // Add production-specific Firestore settings
  firestoreSettings.ignoreUndefinedProperties = true;
}

// Apply settings
db.settings(firestoreSettings);

// Log configuration in development
if (backendEnvConfig.isDev()) {
  console.log('🔥 Firebase Admin initialized:', {
    projectId: backendEnvConfig.getFirebaseProjectId(),
    environment: backendEnvConfig.getEnvironment(),
    usingEmulator: backendEnvConfig.isUsingEmulator(),
    configSummary: backendEnvConfig.getConfigSummary(),
  });

  // Validate security configuration in development
  const securityValidation = backendEnvConfig.validateSecurityConfig();
  if (!securityValidation.isValid) {
    console.warn('⚠️ Security configuration warnings:', securityValidation.warnings);
  }
}

export { admin };
export default admin;
