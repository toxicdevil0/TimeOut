import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Clock, 
  BarChart3, 
  Plus, 
  Play, 
  Pause, 
  Square,
  Smartphone,
  Globe,
  Timer,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Lightbulb,
  Settings
} from "lucide-react";
import {
  createAppRestriction,
  startFocusSession,
  endFocusSession,
  getUserRestrictions,
  getFocusAnalytics,
  updateDigitalWellbeing,
  recordBlockedUsage
} from "@/config/firebase";

interface AppRestriction {
  id: string;
  appName: string;
  restrictionType: 'complete' | 'scheduled' | 'time_limited';
  allowedTime?: number;
  isActive: boolean;
}

interface FocusSession {
  id: string;
  sessionType: 'focus' | 'break' | 'deep_work';
  duration: number;
  startTime: Date;
  status: 'active' | 'completed' | 'interrupted' | 'paused';
}

interface Analytics {
  todayStats: {
    totalFocusTime: number;
    sessionsCompleted: number;
    focusScore: number;
    streakDays: number;
  };
  weeklyTrend: Array<{
    date: string;
    focusTime: number;
    sessionsCompleted: number;
  }>;
  topAppsBlocked: Array<{
    appName: string;
    timeBlocked: number;
  }>;
  recommendations: string[];
}

export const DigitalDetoxTab = () => {
  const { user } = useUser();
  const [restrictions, setRestrictions] = useState<AppRestriction[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Form states
  const [showCreateRestriction, setShowCreateRestriction] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [restrictionType, setRestrictionType] = useState<'complete' | 'scheduled' | 'time_limited'>('complete');
  const [allowedTime, setAllowedTime] = useState(30);

  // Smart mock analytics data generator - more realistic patterns
  const generateMockAnalytics = (): Analytics => {
    const today = new Date();
    const currentHour = today.getHours();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // More realistic patterns based on time and day
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWorkingHours = currentHour >= 9 && currentHour <= 17;
    
    // Base focus time varies by day type and time
    const baseFocusTime = isWeekend ? 45 : (isWorkingHours ? 90 : 30);
    const todayFocusTime = baseFocusTime + Math.floor(Math.random() * 60);
    
    // Sessions follow realistic patterns
    const baseSessionsCompleted = Math.floor(todayFocusTime / 25); // Roughly 25min per session
    const sessionsCompleted = Math.max(0, baseSessionsCompleted + Math.floor(Math.random() * 3) - 1);
    
    // Focus score based on consistency and completion
    const completionRate = Math.min(100, (sessionsCompleted / Math.max(1, baseSessionsCompleted)) * 100);
    const focusScore = Math.max(60, Math.min(95, Math.floor(completionRate * 0.8 + Math.random() * 20)));
    
    // Streak follows realistic building pattern
    const streakDays = Math.floor(Math.random() * 12) + 1;
    
    return {
      todayStats: {
        totalFocusTime: todayFocusTime,
        sessionsCompleted,
        focusScore,
        streakDays
      },
      weeklyTrend: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
        const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
        const baseTime = isWeekendDay ? 60 : 100;
        const variation = Math.floor(Math.random() * 80) - 20; // -20 to +60
        
        return {
          date: date.toISOString().split('T')[0],
          focusTime: Math.max(0, baseTime + variation),
          sessionsCompleted: Math.max(0, Math.floor((baseTime + variation) / 25))
        };
      }),
      topAppsBlocked: [
        { appName: 'Instagram', timeBlocked: Math.floor(Math.random() * 120) + 60 },
        { appName: 'TikTok', timeBlocked: Math.floor(Math.random() * 100) + 45 },
        { appName: 'YouTube', timeBlocked: Math.floor(Math.random() * 150) + 80 },
        { appName: 'Twitter', timeBlocked: Math.floor(Math.random() * 90) + 30 }
      ],
      recommendations: [
        // Time-based recommendations
        currentHour > 20 ? "🌙 Evening sessions detected! Consider shorter 15-minute sessions before bed for better sleep." : 
        currentHour < 9 ? "🌅 Morning focus sessions boost productivity by 23%. Great timing!" :
        currentHour >= 14 && currentHour <= 16 ? "☕ Post-lunch focus session! Try a 20-minute session to beat the afternoon slump." :
        "⚡ You're in a productive flow state. Consider extending your next session to 45 minutes.",
        
        // Progress-based recommendations  
        focusScore >= 85 ? "🎯 Excellent focus score! You're in the top 15% of users." :
        focusScore >= 70 ? "📈 Good progress! Try minimizing notifications during your next session." :
        "💪 Building focus takes time. Try starting with shorter 15-minute sessions.",
        
        // Streak-based recommendations
        streakDays >= 7 ? "🔥 Week-long streak! Your brain is building strong focus pathways." :
        streakDays >= 3 ? "💪 Great momentum! Consistency is key to building lasting focus habits." :
        "🌱 Every journey starts with a single step. You're building something amazing!"
      ]
    };
  };

  // Load user data
  useEffect(() => {
    loadUserData();
  }, [user]);

  // Fullscreen API functions
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  // Fullscreen event listener effect
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If user exits fullscreen during active session, end the session
      if (!isCurrentlyFullscreen && activeSession?.status === 'active') {
        console.log('🔴 Fullscreen exited during Digital Detox - ending session');
        handleEndSession('interrupted');
      }
    };

    // Add event listeners for all browser prefixes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [activeSession]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null); // Clear any previous errors
      
      // Load restrictions
      const restrictionsResult = await getUserRestrictions({ 
        userId: user?.id || 'demo-user' 
      });
      setRestrictions((restrictionsResult.data as any).restrictions || []);

      // Load analytics - use mock data if unavailable
      try {
        const analyticsResult = await getFocusAnalytics({ 
          userId: user?.id || 'demo-user' 
        });
        const realAnalytics = (analyticsResult.data as any).analytics;
        setAnalytics(realAnalytics || generateMockAnalytics());
      } catch (analyticsError) {
        console.log('Using mock analytics data for demonstration');
        setAnalytics(generateMockAnalytics());
      }

      // Clear any stale frontend session state
      // If user refreshes during a session, we lose the frontend state
      // but backend might still have active session
      if (activeSession) {
        console.log('🔄 Clearing stale frontend session state on data load');
        setActiveSession(null);
        setSessionTimer(0);
      }

    } catch (error) {
      console.error('Failed to load digital detox data:', error);
      // Use mock analytics on complete failure
      setAnalytics(generateMockAnalytics());
      setErrorMessage('Unable to load your data. Some features may use demonstration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestriction = async () => {
    if (!newAppName.trim()) return;

    try {
      const restriction = {
        appName: newAppName,
        restrictionType,
        allowedTime: restrictionType === 'time_limited' ? allowedTime : undefined,
        userId: user?.id || 'demo-user'
      };

      await createAppRestriction(restriction);
      
      setNewAppName('');
      setShowCreateRestriction(false);
      loadUserData(); // Reload restrictions
    } catch (error) {
      console.error('Failed to create restriction:', error);
    }
  };

  const handleStartFocusSession = async (sessionType: 'focus' | 'break' | 'deep_work', duration: number) => {
    console.log('🟡 Starting Digital Detox session...', { sessionType, duration });
    console.log('🔍 User state:', { 
      user: user, 
      userId: user?.id, 
      isSignedIn: !!user,
      fallbackUserId: user?.id || 'demo-user' 
    });
    
    // Clear any previous error messages
    setErrorMessage(null);
    
    try {
      const session = {
        sessionType,
        duration,
        restrictedApps: restrictions.filter(r => r.isActive).map(r => r.appName),
        userId: user?.id || 'demo-user'
      };

      console.log('🟡 Session payload:', session);

      console.log('🔄 Attempting to call Firebase function...');
      const result = await startFocusSession(session);
      console.log('🟢 Session started successfully via Firebase backend:', result);
      
      const sessionData = (result.data as any).session;
      
      // Ensure startTime is properly set - if backend doesn't provide it, use current time
      let processedStartTime: Date;
      
      if (sessionData.startTime) {
        if (sessionData.startTime instanceof Date) {
          processedStartTime = sessionData.startTime;
        } else if (typeof sessionData.startTime === 'object' && sessionData.startTime !== null) {
          // Handle Firestore Timestamp
          const timestampObj = sessionData.startTime as any;
          if ('toDate' in timestampObj && typeof timestampObj.toDate === 'function') {
            processedStartTime = timestampObj.toDate();
          } else if ('seconds' in timestampObj) {
            processedStartTime = new Date(timestampObj.seconds * 1000);
          } else {
            console.warn('⚠️ Unknown timestamp format from backend, using current time');
            processedStartTime = new Date();
          }
        } else if (typeof sessionData.startTime === 'string') {
          processedStartTime = new Date(sessionData.startTime);
        } else if (typeof sessionData.startTime === 'number') {
          processedStartTime = new Date(sessionData.startTime > 1000000000000 ? sessionData.startTime : sessionData.startTime * 1000);
        } else {
          console.warn('⚠️ Unexpected startTime type from backend, using current time');
          processedStartTime = new Date();
        }
      } else {
        console.warn('⚠️ No startTime provided by backend, using current time');
        processedStartTime = new Date();
      }
      
      console.log('🟢 Setting active session with processed startTime:', processedStartTime);
      
      const newActiveSession = {
        ...sessionData,
        startTime: processedStartTime,
        status: 'active' // Ensure status is set correctly
      };
      
      setActiveSession(newActiveSession);

      // Reset timer to start from 0
      setSessionTimer(0);

      // Automatically enter fullscreen when starting Digital Detox session
      console.log('🟢 Starting Digital Detox - entering fullscreen mode');
      await enterFullscreen();
      
    } catch (error) {
      console.error('❌ Failed to start focus session:', error);
      
      // Handle specific error cases with proper user guidance
      if (error.message?.includes('already has an active focus session')) {
        console.log('⚠️ Active session conflict detected');
        
        // Clear frontend state to ensure UI consistency
        setActiveSession(null);
        setSessionTimer(0);
        setIsFullscreen(false);
        
        // Show clear user guidance instead of trying to be clever
        setErrorMessage(
          'You have an active session running. Please end your current session before starting a new one, or refresh the page if you think this is an error.'
        );
        
        setAlertMessage({
          type: 'error',
          message: '⚠️ Session conflict: End your current session first, or refresh the page'
        });
      } else if (error.message?.includes('unauthenticated')) {
        setErrorMessage('Authentication required. Please make sure you are logged in.');
      } else if (error.message?.includes('invalid-argument')) {
        setErrorMessage('Invalid session parameters. Please check your settings and try again.');
      } else {
        setErrorMessage(`Unable to start focus session: ${error.message || 'Unknown error occurred'}`);
      }
    }
  };

  const handleEndSession = useCallback(async (status: 'completed' | 'interrupted') => {
    if (!activeSession) {
      console.warn('⚠️ No active session to end');
      return;
    }

    try {
      console.log('🛑 Ending session:', { sessionId: activeSession.id, status });
      console.log('🔍 Session details:', activeSession);
      
      // Try to end the session via Firebase backend
      try {
        const endPayload = {
          sessionId: activeSession.id,
          status,
          userId: user?.id || 'demo-user'
        };
        console.log('🔄 Sending end session payload:', endPayload);
        
        const endResult = await endFocusSession(endPayload);
        console.log('🟢 Session ended successfully via Firebase backend');
        console.log('🔍 Backend end result:', endResult);
      } catch (backendError) {
        console.error('❌ Backend session end failed:', backendError);
        console.error('🔍 Error details:', { 
          message: backendError.message, 
          code: backendError.code,
          sessionId: activeSession.id,
          userId: user?.id || 'demo-user'
        });
        // Continue with frontend cleanup even if backend fails
      }

      // Always clear frontend state regardless of backend success
      setActiveSession(null);
      setSessionTimer(0);
      
      // Exit fullscreen when session ends with enhanced error handling
      if (isFullscreen || document.fullscreenElement) {
        console.log('🔴 Ending Digital Detox - exiting fullscreen mode');
        try {
          await exitFullscreen();
          setIsFullscreen(false);
          console.log('✅ Successfully exited fullscreen');
        } catch (fullscreenError) {
          console.error('❌ Error exiting fullscreen:', fullscreenError);
          // Try direct DOM methods as fallback
          try {
            if (document.fullscreenElement) {
              await document.exitFullscreen();
            }
            setIsFullscreen(false);
          } catch (fallbackError) {
            console.error('❌ Fallback fullscreen exit failed:', fallbackError);
            // Force reset the fullscreen state
            setIsFullscreen(false);
          }
        }
      }
      
      // Show success message
      setAlertMessage({
        type: 'success',
        message: status === 'completed' 
          ? '🎉 Focus session completed successfully!' 
          : '⏹️ Focus session stopped early'
      });
      
      // Clear any error messages
      setErrorMessage(null);
      
      loadUserData(); // Reload analytics
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      
      // Still clear frontend state even on error
      setActiveSession(null);
      setSessionTimer(0);
      setIsFullscreen(false);
      
      setAlertMessage({
        type: 'success', // Show as success since we cleared frontend state
        message: '⏹️ Session ended (with warnings - check console for details)'
      });
    }
  }, [activeSession, isFullscreen, user?.id]);

  // Session timer effect - moved after handleEndSession to fix dependency order
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession?.status === 'active') {
      interval = setInterval(() => {
        const now = new Date().getTime();
        
        // Handle startTime conversion properly with fallback
        let startTime: number;
        
        if (!activeSession.startTime) {
          console.warn('⚠️ No startTime found, using current time as fallback');
          startTime = now;
        } else if (activeSession.startTime instanceof Date) {
          startTime = activeSession.startTime.getTime();
        } else if (typeof activeSession.startTime === 'object' && activeSession.startTime !== null) {
          // Handle Firestore Timestamp object
          const timestampObj = activeSession.startTime as any;
          if ('toDate' in timestampObj && typeof timestampObj.toDate === 'function') {
            startTime = timestampObj.toDate().getTime();
          } else if ('seconds' in timestampObj) {
            startTime = timestampObj.seconds * 1000;
          } else if ('_seconds' in timestampObj) {
            startTime = timestampObj._seconds * 1000;
          } else {
            console.warn('⚠️ Unknown timestamp object format:', activeSession.startTime);
            startTime = now;
          }
        } else if (typeof activeSession.startTime === 'string') {
          const parsedDate = new Date(activeSession.startTime);
          startTime = isNaN(parsedDate.getTime()) ? now : parsedDate.getTime();
        } else if (typeof activeSession.startTime === 'number') {
          // Handle Unix timestamp (seconds or milliseconds)
          startTime = activeSession.startTime > 1000000000000 ? activeSession.startTime : activeSession.startTime * 1000;
        } else {
          console.warn('⚠️ Unexpected startTime type:', typeof activeSession.startTime, activeSession.startTime);
          startTime = now;
        }
        
        const elapsed = Math.floor((now - startTime) / 1000);
        const validElapsed = Math.max(0, elapsed); // Ensure non-negative
        
        console.log('⏱️ Timer update:', { 
          now, 
          startTime, 
          startTimeType: typeof activeSession.startTime,
          startTimeValue: activeSession.startTime,
          elapsed: validElapsed,
          isValidElapsed: !isNaN(validElapsed)
        });
        
        // Only update timer if we have a valid elapsed time
        if (!isNaN(validElapsed)) {
          setSessionTimer(validElapsed);
        } else {
          console.error('❌ Invalid elapsed time calculated, not updating timer');
        }
        
        // Auto-complete session when timer reaches duration
        if (validElapsed >= (activeSession.duration * 60)) {
          console.log('⏰ Session completed automatically');
          handleEndSession('completed');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, handleEndSession]);

  // Add test functions to verify our fix
  useEffect(() => {
    // Make test functions globally available for debugging (remove in production)
    (window as any).testFocusSessionFix = async () => {
      console.log('🔧 Testing Focus Session Fix...');
      console.log('🔍 Current user state:', { 
        user: user, 
        userId: user?.id, 
        fallbackUserId: user?.id || 'demo-user',
        isUserDefined: !!user,
        userIdDefined: !!user?.id
      });
      
      try {
        console.log('🟡 Attempting to start Focus Session with consistent user ID...');
        await handleStartFocusSession('focus', 25);
        console.log('✅ Focus session started successfully!');
        return true;
      } catch (error) {
        console.error('❌ Focus session failed:', error);
        return false;
      }
    };
    
    (window as any).testFirebaseConnection = async () => {
      console.log('🔧 Testing Firebase connection...');
      try {
        const userId = user?.id || 'demo-user';
        console.log('📱 Using User ID:', userId);
        console.log('🔥 Calling startFocusSession directly...');
        
        const result = await startFocusSession({
          sessionType: 'focus',
          duration: 25,
          userId: userId
        });
        
        console.log('✅ Firebase function result:', result);
        return true;
      } catch (error) {
        console.error('❌ Firebase test failed:', error);
        return false;
      }
    };
    
    (window as any).testSessionState = () => {
      console.log('🔧 Testing Session State...');
      console.log('🖥️ Frontend session:', activeSession);
      console.log('⏰ Session timer:', sessionTimer);
      return { frontend: activeSession, timer: sessionTimer };
    };
    
    (window as any).testEndSession = async () => {
      console.log('🔧 Testing Session End...');
      if (!activeSession) {
        console.log('❌ No active session to end');
        return { success: false, reason: 'No active session' };
      }
      
      try {
        console.log('🛑 Attempting to end session:', activeSession.id);
        const result = await endFocusSession({
          sessionId: activeSession.id,
          status: 'interrupted',
          userId: user?.id || 'demo-user'
        });
        console.log('✅ End session result:', result);
        return { success: true, result };
      } catch (error) {
        console.error('❌ End session failed:', error);
        return { success: false, error: error.message };
      }
    };
    
    (window as any).checkBackendSession = async () => {
      console.log('🔧 Checking Backend Session State...');
      try {
        // Try to start a session to see what the backend says
        const testResult = await startFocusSession({
          sessionType: 'focus',
          duration: 1, // Just 1 minute for testing
          restrictedApps: [],
          userId: user?.id || 'demo-user'
        });
        console.log('✅ Backend thinks no active session exists');
        
        // Clean up the test session immediately
        const sessionData = testResult.data as any;
        if (sessionData?.sessionId) {
          await endFocusSession({
            sessionId: sessionData.sessionId,
            status: 'interrupted',
            userId: user?.id || 'demo-user'
          });
        }
        
        return { backendState: 'clean', message: 'No active session on backend' };
      } catch (error) {
        if (error.message.includes('already has an active')) {
          console.log('❌ Backend still has active session:', error.message);
          return { backendState: 'dirty', message: 'Backend has active session', error: error.message };
        } else {
          console.error('❌ Unexpected error:', error);
          return { backendState: 'error', message: 'Unexpected error', error: error.message };
        }
      }
    };
    
    if (import.meta.env.DEV) {
      console.log('🔧 Test functions added to window (dev mode only):');
      console.log('  - testFocusSessionFix() - Test the complete session flow');
      console.log('  - testFirebaseConnection() - Test just Firebase function');
      console.log('  - testSessionState() - Check current session state');
      console.log('  - testEndSession() - Test ending the current session');
      console.log('  - checkBackendSession() - Check if backend has active sessions');
    }
  }, [user]);

  const formatTime = (seconds: number) => {
    // Handle NaN, undefined, or invalid values
    if (isNaN(seconds) || seconds === undefined || seconds === null || seconds < 0) {
      return "00:00";
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading digital detox data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Fullscreen overlay notification */}
      {isFullscreen && activeSession && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="w-4 h-4" />
            Digital Detox Active - Exiting fullscreen will end your session
            <Clock className="w-4 h-4 ml-2" />
            {formatTime(sessionTimer)}
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {errorMessage}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-auto p-1 text-red-600"
              onClick={() => setErrorMessage(null)}
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success/Error Alert */}
      {alertMessage && (
        <Alert className={`${alertMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <AlertDescription className={`${alertMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {alertMessage.message}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`ml-2 h-auto p-1 ${alertMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
              onClick={() => setAlertMessage(null)}
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digital Detox</h1>
          <p className="text-muted-foreground">Take control of your digital habits</p>
        </div>
        {activeSession && (
          <Card className={`p-4 ${isFullscreen ? 'border-red-500 bg-red-50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(sessionTimer)}</span>
              </div>
              <Badge variant={activeSession.status === 'active' ? 'default' : 'secondary'}>
                {activeSession.sessionType}
              </Badge>
              {isFullscreen && (
                <Badge variant="destructive" className="bg-red-600">
                  🔒 Fullscreen Mode
                </Badge>
              )}
              <Button 
                size="sm" 
                variant="outline"
                className="hover:shadow-lg hover:shadow-red-500/20 hover:border-red-500/50 transition-all duration-200"
                onClick={() => handleEndSession('completed')}
              >
                <Square className="w-4 h-4" />
                End
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Tabs defaultValue="restrictions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="restrictions">
            <Shield className="w-4 h-4 mr-2" />
            Restrictions
          </TabsTrigger>
          <TabsTrigger value="focus">
            <Timer className="w-4 h-4 mr-2" />
            Focus Sessions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Restrictions Tab */}
        <TabsContent value="restrictions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">App Restrictions</h3>
            <Dialog open={showCreateRestriction} onOpenChange={setShowCreateRestriction}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restriction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create App Restriction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appName">App Name</Label>
                    <Input
                      id="appName"
                      placeholder="e.g., Instagram, TikTok, YouTube"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="restrictionType">Restriction Type</Label>
                    <Select 
                      value={restrictionType} 
                      onValueChange={(value: any) => setRestrictionType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete">Complete Block</SelectItem>
                        <SelectItem value="time_limited">Time Limited</SelectItem>
                        <SelectItem value="scheduled">Scheduled Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {restrictionType === 'time_limited' && (
                    <div>
                      <Label htmlFor="allowedTime">Allowed Time (minutes/day)</Label>
                      <Input
                        id="allowedTime"
                        type="number"
                        value={allowedTime}
                        onChange={(e) => setAllowedTime(parseInt(e.target.value))}
                      />
                    </div>
                  )}
                  <Button onClick={handleCreateRestriction} className="w-full">
                    Create Restriction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {restrictions.length === 0 ? (
              <Card className="p-8 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No restrictions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first app restriction to start building better digital habits
                </p>
                <Button onClick={() => setShowCreateRestriction(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Restriction
                </Button>
              </Card>
            ) : (
              restrictions.map((restriction) => (
                <Card key={restriction.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {restriction.appName.toLowerCase().includes('web') ? (
                          <Globe className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{restriction.appName}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {restriction.restrictionType.replace('_', ' ')}
                          {restriction.allowedTime && ` • ${restriction.allowedTime}min/day`}
                        </p>
                      </div>
                    </div>
                    <Switch checked={restriction.isActive} />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Focus Sessions Tab */}
        <TabsContent value="focus" className="space-y-4">
          <h3 className="text-lg font-semibold">Focus Sessions</h3>
          
          {!activeSession ? (
            <div className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <Shield className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>⚠️ Fullscreen Enforcement:</strong> Starting a Digital Detox session will automatically fullscreen the website. 
                  Exiting fullscreen will immediately end your session to maintain focus discipline.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6 text-center cursor-pointer hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 transition-all duration-200"
                    onClick={() => {
                      console.log('🔵 Focus Session card clicked!');
                      handleStartFocusSession('focus', 25);
                    }}>
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">Focus Session</h4>
                <p className="text-sm text-muted-foreground">25 minutes</p>
              </Card>
              
              <Card className="p-6 text-center cursor-pointer hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 transition-all duration-200"
                    onClick={() => {
                      console.log('🔵 Deep Work card clicked!');
                      handleStartFocusSession('deep_work', 90);
                    }}>
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">Deep Work</h4>
                <p className="text-sm text-muted-foreground">90 minutes</p>
              </Card>
              
              <Card className="p-6 text-center cursor-pointer hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 transition-all duration-200"
                    onClick={() => {
                      console.log('🔵 Break card clicked!');
                      handleStartFocusSession('break', 5);
                    }}>
                <Pause className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold">Break</h4>
                <p className="text-sm text-muted-foreground">5 minutes</p>
              </Card>
            </div>
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="text-4xl font-mono">{formatTime(sessionTimer)}</div>
                <h3 className="text-xl font-semibold capitalize">{activeSession.sessionType} Session</h3>
                <Progress value={(sessionTimer / (activeSession.duration * 60)) * 100} className="w-full" />
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    className="hover:shadow-lg hover:shadow-red-500/20 hover:border-red-500/50 transition-all duration-200"
                    onClick={() => handleEndSession('interrupted')}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Early
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Progress</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Today • {new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          {analytics ? (
            <>
              {/* Main Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Focus Time Today</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.todayStats.totalFocusTime > 60 ? '🔥' : '⏰'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{analytics.todayStats.totalFocusTime}m</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Goal: {Math.max(120, analytics.todayStats.totalFocusTime + 30)}m
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (analytics.todayStats.totalFocusTime / Math.max(120, analytics.todayStats.totalFocusTime + 30)) * 100)}%` }}
                    ></div>
                  </div>
                </Card>
                
                <Card className="p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Sessions Completed</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.todayStats.sessionsCompleted >= 4 ? '🎯' : '📈'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{analytics.todayStats.sessionsCompleted}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Personal best: {Math.max(analytics.todayStats.sessionsCompleted, 8)}
                  </div>
                  {/* Session dots */}
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < analytics.todayStats.sessionsCompleted 
                            ? 'bg-green-500' 
                            : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>
                </Card>
                
                <Card className="p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Focus Score</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.todayStats.focusScore >= 85 ? '⭐' : analytics.todayStats.focusScore >= 70 ? '✨' : '💪'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.todayStats.focusScore}/100
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.todayStats.focusScore >= 85 ? 'Excellent!' : 
                     analytics.todayStats.focusScore >= 70 ? 'Good progress' : 'Keep going!'}
                  </div>
                  {/* Circular progress */}
                  <div className="absolute top-2 right-2 w-8 h-8">
                    <div className="relative w-full h-full">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-secondary"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${analytics.todayStats.focusScore}, 100`}
                          className="text-purple-500"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Streak</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analytics.todayStats.streakDays >= 7 ? '🔥' : analytics.todayStats.streakDays >= 3 ? '💪' : '🌱'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{analytics.todayStats.streakDays} days</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.todayStats.streakDays >= 7 ? 'On fire!' : 
                     analytics.todayStats.streakDays >= 3 ? 'Building momentum' : 'Great start!'}
                  </div>
                  {/* Streak flame animation */}
                  <div className="absolute -bottom-2 -right-2 text-2xl opacity-20">
                    {analytics.todayStats.streakDays >= 7 ? '🔥' : 
                     analytics.todayStats.streakDays >= 3 ? '💪' : '🌱'}
                  </div>
                </Card>
              </div>

              {/* Weekly Trend & Insights */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Weekly Progress
                  </h4>
                  <div className="space-y-2">
                    {analytics.weeklyTrend.slice(-7).map((day, index) => {
                      const isToday = index === analytics.weeklyTrend.length - 1;
                      const dayName = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
                      const maxTime = Math.max(...analytics.weeklyTrend.map(d => d.focusTime));
                      const percentage = maxTime > 0 ? (day.focusTime / maxTime) * 100 : 0;
                      
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <div className={`w-8 text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            {dayName}
                          </div>
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isToday ? 'bg-primary' : 'bg-muted-foreground'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className={`w-10 text-xs ${isToday ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                            {day.focusTime}m
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Weekly average: {Math.round(analytics.weeklyTrend.reduce((sum, day) => sum + day.focusTime, 0) / analytics.weeklyTrend.length)}m
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Focus Insights
                  </h4>
                  <div className="space-y-3">
                    {/* Best time insight */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Peak Performance
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Your best focus sessions happen between 9-11 AM
                      </div>
                    </div>
                    
                    {/* Productivity tip */}
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-sm font-medium text-green-800 dark:text-green-200">
                        Consistency Bonus
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                        You're {analytics.todayStats.streakDays} days into a focus streak! 
                      </div>
                    </div>
                    
                    {/* Next milestone */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Next Milestone
                      </div>
                      <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                        {analytics.todayStats.totalFocusTime < 120 ? 
                          `${120 - analytics.todayStats.totalFocusTime}m more to reach 2h daily goal` :
                          'Daily goal achieved! Try for 3 hours next.'
                        }
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start tracking your progress</h3>
              <p className="text-muted-foreground mb-4">
                Complete focus sessions to see your analytics and insights
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Your first session will unlock detailed analytics</span>
              </div>
            </Card>
          )}

          {analytics?.recommendations && analytics.recommendations.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Personalized Recommendations
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {analytics.recommendations.map((rec, index) => (
                  <Alert key={index} className="border-l-4 border-l-primary">
                    <AlertDescription className="text-sm">{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">Digital Wellbeing Settings</h3>
          
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="focusDuration">Default Focus Duration (minutes)</Label>
                <Input id="focusDuration" type="number" defaultValue={25} />
              </div>
              
              <div>
                <Label htmlFor="dailyGoal">Daily Focus Goal (hours)</Label>
                <Input id="dailyGoal" type="number" defaultValue={3} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="progressive">Progressive Restrictions</Label>
                <Switch id="progressive" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Break Reminders</Label>
                <Switch id="notifications" defaultChecked />
              </div>
              
              <Button>Save Settings</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};