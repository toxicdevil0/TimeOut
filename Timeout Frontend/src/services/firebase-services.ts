// Client-side Firebase services - No Cloud Functions needed!
// This replaces all the httpsCallable functions with direct Firestore operations

import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  increment 
} from '../config/firebase-client';
import { auth } from '../config/firebase-client';

// Types
interface Room {
  id?: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdBy: string;
  participants: string[];
  maxParticipants: number;
  createdAt: any;
}

interface UserProfile {
  id?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'student' | 'teacher' | 'admin';
  preferences: any;
  studyStats: any;
  createdAt: any;
  lastActive: any;
}

// Room Management (Client-side)
export const roomService = {
  // Create a new room
  async createRoom(roomData: Omit<Room, 'id' | 'createdAt'>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const room = {
      ...roomData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      participants: [user.uid]
    };

    const docRef = await addDoc(collection(db, 'rooms'), room);
    return { id: docRef.id, ...room };
  },

  // Join a room
  async joinRoom(roomId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) throw new Error('Room not found');
    
    const roomData = roomDoc.data();
    if (roomData.participants.includes(user.uid)) {
      throw new Error('Already in room');
    }
    
    if (roomData.participants.length >= roomData.maxParticipants) {
      throw new Error('Room is full');
    }

    await updateDoc(roomRef, {
      participants: [...roomData.participants, user.uid],
      lastActivity: serverTimestamp()
    });

    return { success: true };
  },

  // Leave a room  
  async leaveRoom(roomId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) throw new Error('Room not found');
    
    const roomData = roomDoc.data();
    const updatedParticipants = roomData.participants.filter((id: string) => id !== user.uid);

    await updateDoc(roomRef, {
      participants: updatedParticipants,
      lastActivity: serverTimestamp()
    });

    return { success: true };
  },

  // Get public rooms
  async getPublicRooms() {
    const q = query(
      collection(db, 'rooms'), 
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get room details
  async getRoomDetails(roomId: string) {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (!roomDoc.exists()) throw new Error('Room not found');
    return { id: roomDoc.id, ...roomDoc.data() };
  },

  // Real-time room updates
  subscribeToRoom(roomId: string, callback: (room: any) => void) {
    return onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }
};

// User Management (Client-side)
export const userService = {
  // Get user profile
  async getUserProfile(userId?: string) {
    const user = auth.currentUser;
    const targetId = userId || user?.uid;
    if (!targetId) throw new Error('Not authenticated');

    const userDoc = await getDoc(doc(db, 'users', targetId));
    if (!userDoc.exists()) throw new Error('User not found');
    return { id: userDoc.id, ...userDoc.data() };
  },

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    await updateDoc(doc(db, 'users', user.uid), {
      ...updates,
      lastActive: serverTimestamp()
    });

    return { success: true };
  },

  // Create/update user on first login
  async initializeUser(userData: Partial<UserProfile>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user
      await addDoc(collection(db, 'users'), {
        ...userData,
        id: user.uid,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        studyStats: {
          totalSessions: 0,
          totalTime: 0,
          streak: 0
        }
      });
    } else {
      // Update last active
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });
    }

    return { success: true };
  }
};

// Study Session Management
export const studyService = {
  // Start study session
  async startSession(roomId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const session = {
      userId: user.uid,
      roomId,
      startTime: serverTimestamp(),
      status: 'active'
    };

    const docRef = await addDoc(collection(db, 'studySessions'), session);
    return { id: docRef.id, ...session };
  },

  // End study session
  async endSession(sessionId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    await updateDoc(doc(db, 'studySessions', sessionId), {
      endTime: serverTimestamp(),
      status: 'completed'
    });

    // Update user stats
    await updateDoc(doc(db, 'users', user.uid), {
      'studyStats.totalSessions': increment(1),
      lastActive: serverTimestamp()
    });

    return { success: true };
  },

  // Get user's study history
  async getStudyHistory(userId?: string) {
    const user = auth.currentUser;
    const targetId = userId || user?.uid;
    if (!targetId) throw new Error('Not authenticated');

    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', targetId),
      orderBy('startTime', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Export all services
export default {
  rooms: roomService,
  users: userService,
  study: studyService
};