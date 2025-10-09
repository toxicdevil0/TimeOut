import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Users, 
  Timer, 
  LogOut, 
  Settings,
  Play,
  Pause,
  AlertCircle,
  BookOpen,
  Coffee
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getRoomDetails, leaveRoom, updateParticipantStatus } from "@/config/firebase";

interface GroupSessionProps {
  groupName: string;
  groupId: string;
  onLeaveGroup: () => void;
}

interface Participant {
  id: string;
  name: string;
  isStudying: boolean;
  subject?: string;
  lastCheckIn?: Date;
}

// Proper error types instead of generic strings
type CameraError = 
  | { type: 'permission_denied'; message: string }
  | { type: 'device_not_found'; message: string }
  | { type: 'constraint_not_satisfied'; message: string }
  | { type: 'playback_error'; message: string }
  | { type: 'browser_not_supported'; message: string }
  | { type: 'unknown'; message: string };

// Video constraints - configurable instead of hardcoded
const VIDEO_CONSTRAINTS = {
  width: { ideal: 640, max: 1280 },
  height: { ideal: 480, max: 720 },
  facingMode: 'user'
} as const;

export function GroupSession({ groupName, groupId, onLeaveGroup }: GroupSessionProps) {
  const { user } = useUser();
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'studying' | 'away'>('studying');
  const [nextCheckIn, setNextCheckIn] = useState<Date | null>(null);
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [streamActive, setStreamActive] = useState(false); // Track if stream is actually active
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [automaticMonitoringEnabled, setAutomaticMonitoringEnabled] = useState(false);
  const [nextCheckInCountdown, setNextCheckInCountdown] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const checkInTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  // Cleanup function to prevent memory leaks
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current);
      checkInTimeoutRef.current = null;
    }
    
    setStreamActive(false);
    setCameraEnabled(false);
    setVideoLoaded(false);
    setShowCheckInPrompt(false);
    setNextCheckIn(null);
    setCameraError(null);
    setIsCapturingPhoto(false);
    setLastCapturedPhoto(null);
  }, []);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupCamera();
    };
  }, [cleanupCamera]);

  // Browser compatibility check
  const checkBrowserSupport = (): CameraError | null => {
    if (!navigator.mediaDevices) {
      return {
        type: 'browser_not_supported',
        message: 'Your browser does not support camera access. Please use a modern browser.'
      };
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      return {
        type: 'browser_not_supported', 
        message: 'Camera access is not supported in this browser.'
      };
    }
    
    // Check HTTPS requirement (getUserMedia requires secure context)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return {
        type: 'browser_not_supported',
        message: 'Camera access requires HTTPS in production. Please use a secure connection.'
      };
    }
    
    return null;
  };

  // Parse getUserMedia errors into our error types
  const parseMediaError = (error: any): CameraError => {
    if (error.name === 'NotAllowedError') {
      return {
        type: 'permission_denied',
        message: 'Camera permission denied. Please allow camera access and try again.'
      };
    }
    
    if (error.name === 'NotFoundError') {
      return {
        type: 'device_not_found',
        message: 'No camera found. Please connect a camera and try again.'
      };
    }
    
    if (error.name === 'OverconstrainedError') {
      return {
        type: 'constraint_not_satisfied',
        message: 'Camera constraints could not be satisfied. Please try with different settings.'
      };
    }
    
    return {
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unknown camera error occurred.'
    };
  };

  // Proper video lifecycle management - FIXED
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    
    // Only proceed if we have both video element and stream, and camera is enabled
    if (!video || !stream || !cameraEnabled) return;

    const handleLoadedMetadata = () => {
      if (isMountedRef.current) {
        setVideoLoaded(true);
      }
    };

    const handleCanPlay = () => {
      video.play().catch(e => {
        if (isMountedRef.current) {
          setCameraError({
            type: 'playback_error',
            message: 'Video autoplay blocked. Click the play button to start.'
          });
        }
      });
    };

    const handlePlay = () => {
      if (isMountedRef.current) {
        setStreamActive(true);
        setCameraError(null); // Clear any playback errors
      }
    };

    const handleError = (e: Event) => {
      console.error('❌ Video error:', e);
      if (isMountedRef.current) {
        setCameraError({
          type: 'playback_error',
          message: 'Video playback failed. Please try restarting the camera.'
        });
      }
    };

    // Assign stream to video element - DO THIS ONLY ONCE HERE
    video.srcObject = stream;

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('error', handleError);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('error', handleError);
    };
  }, [cameraEnabled]); // FIXED: Only depend on cameraEnabled, not streamRef.current

  // Load room data and participants from backend
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getRoomDetails({ 
          roomId: groupId,
          userId: user?.id || 'demo-user'
        });
        
        const roomInfo = (result.data as any).room;
        setRoomData(roomInfo);
        
        // Transform participants data
        const participantsList = Object.entries(roomInfo.participants || {}).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || data.email || 'Unknown',
          isStudying: data.isActive === true,
          subject: roomInfo.subject || 'General',
          lastCheckIn: data.joinedAt ? new Date(data.joinedAt.seconds * 1000) : new Date()
        }));
        
        setParticipants(participantsList);
        
        // Set initial user status based on current user's isActive state
        const currentUserId = user?.id || 'demo-user';
        const currentUserData = roomInfo.participants?.[currentUserId];
        if (currentUserData) {
          setUserStatus(currentUserData.isActive ? 'studying' : 'away');
        }
      } catch (err) {
        console.error('Failed to load room data:', err);
        setError('Failed to load room details');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadRoomData();
    }
  }, [groupId, user?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Schedule check-in with proper cleanup - Modified for 15-20 second intervals
  const scheduleCheckIn = useCallback(() => {
    if (!isMountedRef.current || !cameraEnabled || !isTimerRunning || !automaticMonitoringEnabled) return;
    
    // Changed to 15-20 seconds for continuous monitoring
    const delay = (15 + Math.random() * 5) * 1000; // 15-20 seconds
    const nextCheckTime = new Date(Date.now() + delay);
    
    setNextCheckIn(nextCheckTime);
    
    checkInTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && cameraEnabled && isTimerRunning && automaticMonitoringEnabled) {
        // Auto-capture instead of showing prompt
        handleAutomaticPhotoCapture();
      }
    }, delay);
  }, [cameraEnabled, isTimerRunning, automaticMonitoringEnabled]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }

    // Always return cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning]);

  // Automatic monitoring effect
  useEffect(() => {
    if (automaticMonitoringEnabled && cameraEnabled && isTimerRunning) {
      // Start automatic monitoring immediately
      scheduleCheckIn();
    } else {
      // Stop automatic monitoring
      if (checkInTimeoutRef.current) {
        clearTimeout(checkInTimeoutRef.current);
        checkInTimeoutRef.current = null;
      }
      setNextCheckIn(null);
    }
  }, [automaticMonitoringEnabled, cameraEnabled, isTimerRunning, scheduleCheckIn]);

  // Countdown timer for next automatic capture
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (automaticMonitoringEnabled && nextCheckIn) {
      countdownInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextCheckIn.getTime() - Date.now()) / 1000));
        setNextCheckInCountdown(remaining);
        
        if (remaining === 0) {
          clearInterval(countdownInterval!);
        }
      }, 1000);
    } else {
      setNextCheckInCountdown(0);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [automaticMonitoringEnabled, nextCheckIn]);

  const handleLeaveRoom = async () => {
    try {
      setLoading(true);
      
      // Call backend leaveRoom function
      await leaveRoom({ 
        roomId: groupId,
        userId: user?.id || 'demo-user'
      });
      
      console.log('✅ Left room successfully');
    } catch (err) {
      console.error('❌ Failed to leave room:', err);
      // Still proceed to leave locally even if backend call fails
    } finally {
      setLoading(false);
      // Call the original onLeaveGroup to navigate away
      onLeaveGroup();
    }
  };

  const handleStatusToggle = async () => {
    try {
      setLoading(true);
      const newStatus = userStatus === 'studying' ? 'away' : 'studying';
      
      // Update status in backend
      await updateParticipantStatus({ 
        roomId: groupId,
        isActive: newStatus === 'studying',
        userId: user?.id || 'demo-user'
      });
      
      // Update local state
      setUserStatus(newStatus);
      
      console.log(`✅ Status updated to: ${newStatus}`);
    } catch (err) {
      console.error('❌ Failed to update status:', err);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCamera = async () => {
    try {
      setCameraError(null);
      
      // Check browser support first
      const browserError = checkBrowserSupport();
      if (browserError) {
        setCameraError(browserError);
        return;
      }
      
      // Get user media with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: VIDEO_CONSTRAINTS,
        audio: false 
      });
      
      // Check video tracks
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track, index) => {
        // Track validation for debugging in development only
        if (process.env.NODE_ENV === 'development') {
          console.log(`Track ${index}:`, {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            label: track.label
          });
        }
      });
      
      // Store stream reference
      streamRef.current = stream;
      
      // Enable camera - this will trigger useEffect to handle video lifecycle
      setCameraEnabled(true);
      
      // Schedule first check-in
      scheduleCheckIn();
      
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setCameraError(parseMediaError(error));
    }
  };

  const handleStopCamera = () => {
    cleanupCamera();
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    // Restart check-in scheduling when timer starts
    if (cameraEnabled) {
      scheduleCheckIn();
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    // Clear check-in when timer is paused
    if (checkInTimeoutRef.current) {
      clearTimeout(checkInTimeoutRef.current);
      checkInTimeoutRef.current = null;
      setNextCheckIn(null);
      setShowCheckInPrompt(false);
    }
  };

  // Automatic photo capture for continuous monitoring (15-20 second intervals)
  const handleAutomaticPhotoCapture = async () => {
    if (!videoRef.current || !streamRef.current) {
      console.warn('Camera not available for automatic capture');
      // Continue scheduling even if capture fails
      scheduleCheckIn();
      return;
    }

    const video = videoRef.current;
    
    // Skip if video not ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video not ready for automatic capture');
      scheduleCheckIn();
      return;
    }

    try {
      // Create canvas to capture photo silently
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Mirror the image to match what user sees
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0);
      
      // Convert to data URL for storage/verification
      const dataURL = canvas.toDataURL('image/jpeg', 0.7); // Lower quality for frequent captures
      setLastCapturedPhoto(dataURL);
      
      // Convert to blob and potentially send to verification system
      canvas.toBlob(async (blob) => {
        if (blob && isMountedRef.current) {
          // Here you could integrate with the verification system
          // For now, just increment count and schedule next capture
          setCheckInCount(prev => prev + 1);
          
          // Optional: Send to backend verification system
          try {
            // Example integration with community verification
            // await createStudyCheckIn({
            //   roomId: groupId,
            //   checkInType: 'photo',
            //   photoUrl: dataURL,
            //   userId: user?.id || 'demo-user'
            // });
          } catch (error) {
            console.warn('Failed to submit automatic check-in:', error);
          }
          
          // Schedule next automatic capture
          scheduleCheckIn();
        }
      }, 'image/jpeg', 0.7);
      
      // Clean up canvas
      canvas.remove();
      
    } catch (error) {
      console.error('❌ Error in automatic photo capture:', error);
      // Continue scheduling even if capture fails
      scheduleCheckIn();
    }
  };

  const handleCheckInPhoto = async () => {
    if (!videoRef.current || !streamRef.current) {
      setCameraError({
        type: 'playback_error',
        message: 'Camera not available. Please restart camera.'
      });
      return;
    }

    const video = videoRef.current;
    
    // Defensive checks for video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError({
        type: 'playback_error',
        message: 'Video not ready for capture. Please wait for video to load.'
      });
      return;
    }

    setIsCapturingPhoto(true);
    setCameraError(null);

    try {
      // Create canvas to capture photo
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Mirror the image to match what user sees
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0);
      
      // Convert to data URL for preview
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      setLastCapturedPhoto(dataURL);
      
      // Convert to blob for "upload" (currently just simulated)
      canvas.toBlob((blob) => {
        if (blob && isMountedRef.current) {
          // Simulate upload delay
          setTimeout(() => {
            if (isMountedRef.current) {
              setCheckInCount(prev => prev + 1);
              setShowCheckInPrompt(false);
              setIsCapturingPhoto(false);
              
              // Schedule next check-in only after successful capture
              scheduleCheckIn();
            }
          }, 1000); // Simulate 1 second upload time
          
        } else {
          throw new Error('Failed to create photo blob');
        }
      }, 'image/jpeg', 0.8);
      
      // Clean up canvas
      canvas.remove();
      
    } catch (error) {
      console.error('❌ Error capturing photo:', error);
      setIsCapturingPhoto(false);
      setCameraError({
        type: 'unknown',
        message: `Failed to capture photo: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {loading && (
        <Card className="glass p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading room data...</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Session: {groupName}</h1>
          <p className="text-muted-foreground">Group ID: {groupId}</p>
          {roomData && (
            <p className="text-sm text-muted-foreground">Subject: {roomData.subject || 'General'}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={userStatus === 'studying' ? 'default' : 'outline'} 
            onClick={handleStatusToggle}
            disabled={loading}
            className={userStatus === 'studying' ? 'bg-success hover:bg-success/90' : ''}
          >
            {userStatus === 'studying' ? (
              <BookOpen className="h-4 w-4 mr-2" />
            ) : (
              <Coffee className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Updating...' : (userStatus === 'studying' ? 'Studying' : 'Away')}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="destructive" onClick={handleLeaveRoom} disabled={loading}>
            <LogOut className="h-4 h-4 mr-2" />
            {loading ? 'Leaving...' : 'Leave Group'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer and Camera Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Study Timer
              </h2>
              <Badge variant="secondary">
                {isTimerRunning ? 'Running' : 'Paused'}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-6xl font-mono font-bold mb-6">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex justify-center gap-2">
                {!isTimerRunning ? (
                  <Button onClick={handleStartTimer}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={handlePauseTimer}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Timer
                  </Button>
                )}
              </div>
              
              {/* Next check-in indicator */}
              {nextCheckIn && isTimerRunning && cameraEnabled && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Next check-in: {nextCheckIn.toLocaleTimeString()}
                </div>
              )}
            </div>
          </Card>

          {/* Camera Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Check-in
              </h2>
              <div className="flex items-center gap-2">
                {!cameraEnabled ? (
                  <Button onClick={handleStartCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button variant="destructive" onClick={handleStopCamera}>
                      Stop Camera
                    </Button>
                    <div className="flex items-center gap-2 ml-4 border-l pl-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={automaticMonitoringEnabled}
                          onChange={(e) => setAutomaticMonitoringEnabled(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Auto Monitor (15-20s)
                      </label>
                      {automaticMonitoringEnabled && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          🔄 Active
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Debug Information - Enhanced with new state */}
            {/* Error Display - Fixed to show proper error message */}
            {cameraError && (
              <Alert className="border-destructive bg-destructive/5 mb-4">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <strong>Camera Error ({cameraError.type}):</strong> {cameraError.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Video Container - Enhanced visibility logic */}
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full max-w-md mx-auto rounded-lg border ${
                  cameraEnabled ? 'block' : 'hidden'
                }`}
                style={{ 
                  transform: 'scaleX(-1)',
                  minHeight: '240px',
                  backgroundColor: '#000',
                  objectFit: 'cover',
                  opacity: videoLoaded && streamActive ? 1 : 0.5
                }}
              />
              
              {cameraEnabled && (
                <>
                  <Badge className={`absolute top-2 left-2 text-white ${
                    streamActive ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {streamActive ? 'Live' : 'Loading...'}
                  </Badge>
                  
                  {/* Automatic monitoring status */}
                  {automaticMonitoringEnabled && (
                    <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                      🤖 Auto ({checkInCount})
                    </Badge>
                  )}
                  
                  {/* Next check-in countdown */}
                  {automaticMonitoringEnabled && nextCheckIn && nextCheckInCountdown > 0 && (
                    <div className="absolute top-12 right-2 text-xs bg-black/70 text-white px-2 py-1 rounded">
                      Next: {nextCheckInCountdown}s
                    </div>
                  )}
                  
                  {/* Debug info overlay - Enhanced */}
                  <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white p-1 rounded">
                    Stream: {streamRef.current ? 'Active' : 'None'} | 
                    Playing: {streamActive ? 'Yes' : 'No'}
                  </div>
                  
                  {/* Manual play button - Enhanced with better state checking */}
                  <button 
                    onClick={async () => {
                      if (videoRef.current && streamRef.current) {
                        try {
                          await videoRef.current.play();
                        } catch (e) {
                          console.error('❌ Manual play failed:', e);
                          setCameraError({
                            type: 'playback_error',
                            message: 'Manual play failed. Please check permissions.'
                          });
                        }
                      }
                    }}
                    className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs hover:bg-primary/80"
                    disabled={!streamRef.current}
                  >
                    ▶️ Play
                  </button>
                  
                  {/* Loading indicator when video not ready */}
                  {!streamActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="text-white text-sm">Initializing camera...</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Automatic Monitoring Summary */}
          {automaticMonitoringEnabled && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    🤖 Automatic Monitoring Active
                  </h3>
                  <p className="text-sm text-blue-700">
                    Capturing photos every 15-20 seconds for verification
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">{checkInCount}</div>
                  <div className="text-xs text-blue-700">Auto Captures</div>
                  {nextCheckInCountdown > 0 && (
                    <div className="text-xs text-blue-600 mt-1">
                      Next in {nextCheckInCountdown}s
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Photo Check-in Prompt - Enhanced with states */}
          {showCheckInPrompt && (
            <Card className="p-4 border-2 border-primary bg-primary/5">
              <div className="text-center">
                <h3 className="font-semibold mb-2">
                  {isCapturingPhoto ? 'Capturing Photo...' : 'Time for Check-in Photo!'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isCapturingPhoto 
                    ? 'Please wait while we capture your photo...'
                    : 'Take a photo to verify you\'re still studying'
                  }
                </p>
                <Button 
                  onClick={handleCheckInPhoto} 
                  disabled={isCapturingPhoto || !streamActive}
                  className="min-w-[150px]"
                >
                  {isCapturingPhoto ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Take Check-in Photo
                    </>
                  )}
                </Button>
                
                {/* Skip option for emergencies */}
                <div className="mt-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowCheckInPrompt(false);
                      scheduleCheckIn();
                    }}
                    disabled={isCapturingPhoto}
                  >
                    Skip this check-in
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Last captured photo preview */}
          {lastCapturedPhoto && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <h4 className="font-medium text-green-800 mb-2">✅ Last Check-in Photo</h4>
                <img 
                  src={lastCapturedPhoto} 
                  alt="Last check-in" 
                  className="w-32 h-24 object-cover rounded mx-auto mb-2"
                />
                <p className="text-xs text-green-600">
                  Photo captured successfully • Check-ins completed: {checkInCount}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Participants Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              Participants ({participants.length})
            </h2>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{participant.name}</div>
                    {participant.subject && (
                      <div className="text-sm text-muted-foreground">{participant.subject}</div>
                    )}
                  </div>
                  <Badge variant={participant.isStudying ? "default" : "secondary"}>
                    {participant.isStudying ? "Studying" : "Away"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Study Stats */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Study Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Session Time:</span>
                <span className="font-medium">{formatTime(timerSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Participants:</span>
                <span className="font-medium">{participants.filter(p => p.isStudying).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Next Check-in:</span>
                <span className="font-medium">
                  {nextCheckIn ? `${Math.ceil((nextCheckIn.getTime() - Date.now()) / 1000)}s` : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
