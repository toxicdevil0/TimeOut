// Clerk + Firebase Auth integration
import { useUser } from '@clerk/clerk-react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import { useEffect, useState } from 'react';

export const useFirebaseAuth = () => {
  const { user } = useUser();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncFirebaseAuth = async () => {
      if (!user) {
        setFirebaseUser(null);
        setLoading(false);
        return;
      }

      try {
        // Get custom token from your backend
        // For hackathon demo, we'll use a simpler approach
        
        // Create a custom token using user ID
        // This is a simplified version - in production you'd get this from your backend
        const customToken = await generateCustomToken(user.id);
        
        if (customToken) {
          const result = await signInWithCustomToken(auth, customToken);
          setFirebaseUser(result.user);
        }
      } catch (error) {
        console.error('Firebase auth sync failed:', error);
        // Fallback: continue without Firebase auth for demo
      }
      
      setLoading(false);
    };

    syncFirebaseAuth();
  }, [user]);

  return { firebaseUser, loading };
};

// Simplified custom token generation for hackathon demo
const generateCustomToken = async (userId: string): Promise<string | null> => {
  try {
    // For hackathon: create a simple JWT-like token
    // In production, this would be done on your backend
    const payload = {
      uid: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    };
    
    // This is a demo implementation - don't use in production
    return btoa(JSON.stringify(payload));
  } catch (error) {
    console.error('Token generation failed:', error);
    return null;
  }
};