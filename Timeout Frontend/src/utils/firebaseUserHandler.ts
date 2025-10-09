import { getFirestore, doc, getDoc, setDoc, updateDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// Get the existing Firebase app (already initialized in config/firebase.ts)
const app = getApp();
export const db = getFirestore(app);

// Connect to Firestore emulator in development
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8090);
    console.log('🔥 Connected to Firestore emulator');
  } catch (error) {
    console.log('🔥 Firestore emulator connection already established');
  }
}

export const ensureUserExists = async (clerkUser: any) => {
  try {
    console.log('🔍 Checking if user exists in database...', clerkUser.id);
    
    const userDocRef = doc(db, 'users', clerkUser.id);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('👤 Creating new user in database...');
      
      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        displayName: clerkUser.firstName + ' ' + clerkUser.lastName || 'Anonymous',
        avatarUrl: clerkUser.imageUrl || '',
        role: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        studyStats: {
          totalStudyTime: 0,
          sessionsCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          weeklyGoal: 0,
          weeklyProgress: 0,
        },
        preferences: {
          defaultFocusTime: 25,
          shortBreakTime: 5,
          longBreakTime: 15,
          sessionsBeforeLongBreak: 4,
          soundEnabled: true,
          notificationsEnabled: true,
          theme: 'system',
        },
      };
      
      await setDoc(userDocRef, userData);
      console.log('✅ User created successfully in database');
      return userData;
    } else {
      console.log('✅ User already exists in database');
      const existingData = userDoc.data();
      
      await updateDoc(userDocRef, {
        updatedAt: new Date()
      });
      
      return existingData;
    }
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    throw error;
  }
};

export const getUserData = async (clerkUserId: string) => {
  try {
    const userDocRef = doc(db, 'users', clerkUserId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('❌ Error getting user data:', error);
    throw error;
  }
};

export const handleAuthSuccess = async (clerkUser: any) => {
  try {
    const userData = await ensureUserExists(clerkUser);
    console.log('✅ Authentication success, user data:', userData);
    return userData;
  } catch (error) {
    console.error('❌ Auth handling failed:', error);
    throw error;
  }
};
