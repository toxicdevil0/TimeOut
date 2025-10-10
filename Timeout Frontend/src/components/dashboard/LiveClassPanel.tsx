import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Play, 
  Square, 
  CheckCircle, 
  Circle, 
  Pause, 
  Mic,
  MicOff,
  Video,
  Camera,
  AlertCircle,
  Volume2,
  Volume1,
  Volume,
  VolumeX
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define TypeScript interfaces for the component
interface Student {
  id: string;
  name: string;
  isActive: boolean;
  isInFocus: boolean;
  joinedAt: Date;
  hasCameraEnabled?: boolean;
  hasMicrophoneEnabled?: boolean;
  lastCheckIn?: Date;
  // Add audio intensity property
  audioIntensity?: number;
}

interface ClassState {
  id: string;
  status: 'active' | 'ended' | 'paused';
  startedAt?: Date;
  endedAt?: Date;
}

interface LiveClassPanelProps {
  classId: string;
  className?: string;
  classSubject?: string;
  userType: 'teacher' | 'student';
  // These functions should be provided by parent component or hooks
  useLiveStudents?: (classId: string) => {
    students: Student[];
    isLoading: boolean;
    error: string | null;
  };
  startClass?: (classId: string) => Promise<void>;
  endClass?: (classId: string) => Promise<void>;
  pauseClass?: (classId: string) => Promise<void>;
  resumeClass?: (classId: string) => Promise<void>;
  toggleAudio?: (classId: string) => Promise<void>;
  toggleVideo?: (classId: string) => Promise<void>;
  enableStudentCamera?: (classId: string, studentId: string) => Promise<void>;
  disableStudentCamera?: (classId: string, studentId: string) => Promise<void>;
  enableStudentMicrophone?: (classId: string, studentId: string) => Promise<void>;
  disableStudentMicrophone?: (classId: string, studentId: string) => Promise<void>;
  // Additional functions can be added here
  [key: string]: any; // Allow for additional props
}

// Mock hook for demonstration - replace with actual implementation
const useMockLiveStudents = (classId: string) => {
  const [students] = useState<Student[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: true,
      audioIntensity: 65, // Mock audio intensity
    },
    {
      id: '2',
      name: 'Bob Smith',
      isActive: true,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      hasCameraEnabled: false,
      hasMicrophoneEnabled: false,
    },
    {
      id: '3',
      name: 'Carol Davis',
      isActive: false,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 900000), // 15 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: true,
      audioIntensity: 25, // Mock audio intensity
    },
    {
      id: '4',
      name: 'David Wilson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 180000), // 3 minutes ago
      hasCameraEnabled: true,
      hasMicrophoneEnabled: false,
    },
  ]);

  return {
    students,
    isLoading: false,
    error: null,
  };
};

// Mock functions for demonstration - replace with actual implementations
const mockStartClass = async (classId: string) => {
  console.log(`Starting class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockEndClass = async (classId: string) => {
  console.log(`Ending class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockPauseClass = async (classId: string) => {
  console.log(`Pausing class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockResumeClass = async (classId: string) => {
  console.log(`Resuming class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockToggleAudio = async (classId: string) => {
  console.log(`Toggling audio for class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockToggleVideo = async (classId: string) => {
  console.log(`Toggling video for class ${classId}`);
  // In real implementation, this would call Firebase function
};

const mockEnableStudentCamera = async (classId: string, studentId: string) => {
  console.log(`Enabling camera for student ${studentId} in class ${classId}`);
};

const mockDisableStudentCamera = async (classId: string, studentId: string) => {
  console.log(`Disabling camera for student ${studentId} in class ${classId}`);
};

const mockEnableStudentMicrophone = async (classId: string, studentId: string) => {
  console.log(`Enabling microphone for student ${studentId} in class ${classId}`);
};

const mockDisableStudentMicrophone = async (classId: string, studentId: string) => {
  console.log(`Disabling microphone for student ${studentId} in class ${classId}`);
};

export const LiveClassPanel: React.FC<LiveClassPanelProps> = ({
  classId,
  className = 'Live Class',
  classSubject = 'Mathematics',
  userType = 'teacher',
  useLiveStudents = useMockLiveStudents,
  startClass = mockStartClass,
  endClass = mockEndClass,
  pauseClass = mockPauseClass,
  resumeClass = mockResumeClass,
  toggleAudio = mockToggleAudio,
  toggleVideo = mockToggleVideo,
  enableStudentCamera = mockEnableStudentCamera,
  disableStudentCamera = mockDisableStudentCamera,
  enableStudentMicrophone = mockEnableStudentMicrophone,
  disableStudentMicrophone = mockDisableStudentMicrophone,
  ...additionalProps
}) => {
  const { students, isLoading, error } = useLiveStudents(classId);
  const [classState, setClassState] = useState<ClassState>({
    id: classId,
    status: 'ended',
  });
  
  // Camera state for teacher
  const [teacherCameraEnabled, setTeacherCameraEnabled] = useState(false);
  const [teacherCameraError, setTeacherCameraError] = useState<string | null>(null);
  const [teacherStreamActive, setTeacherStreamActive] = useState(false);
  
  // Microphone state for teacher
  const [teacherMicrophoneEnabled, setTeacherMicrophoneEnabled] = useState(false);
  const [teacherMicrophoneError, setTeacherMicrophoneError] = useState<string | null>(null);
  const [teacherAudioIntensity, setTeacherAudioIntensity] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnimationRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Cleanup function to prevent memory leaks for camera
  const cleanupCamera = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      videoStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setTeacherStreamActive(false);
    setTeacherCameraEnabled(false);
    setTeacherCameraError(null);
  }, []);

  // Cleanup function for microphone
  const cleanupMicrophone = useCallback(() => {
    // Stop microphone tracks if they exist
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach(track => {
        track.stop();
      });
      audioStreamRef.current = null;
    }
    
    // Stop audio analysis
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
    }
    
    setTeacherMicrophoneEnabled(false);
    setTeacherMicrophoneError(null);
    setTeacherAudioIntensity(0);
  }, []);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanupCamera();
      cleanupMicrophone();
    };
  }, [cleanupCamera, cleanupMicrophone]);

  // Browser compatibility check
  const checkBrowserSupport = (): string | null => {
    if (!navigator.mediaDevices) {
      return 'Your browser does not support camera/microphone access. Please use a modern browser.';
    }
    
    if (!navigator.mediaDevices.getUserMedia) {
      return 'Camera/microphone access is not supported in this browser.';
    }
    
    // Check HTTPS requirement
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      return 'Camera/microphone access requires HTTPS in production. Please use a secure connection.';
    }
    
    return null;
  };

  // Handle teacher camera start
  const handleStartTeacherCamera = async () => {
    try {
      setTeacherCameraError(null);
      
      // Check browser support first
      const browserError = checkBrowserSupport();
      if (browserError) {
        setTeacherCameraError(browserError);
        return;
      }
      
      // Get existing video stream or create new one
      let stream: MediaStream;
      if (videoStreamRef.current) {
        stream = videoStreamRef.current;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            facingMode: 'user'
          }
        });
        videoStreamRef.current = stream;
      }
      
      // Enable camera
      setTeacherCameraEnabled(true);
      setTeacherStreamActive(true);
      
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error);
      let errorMessage = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints could not be satisfied. Please try with different settings.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setTeacherCameraError(errorMessage);
    }
  };

  // Handle teacher camera stop
  const handleStopTeacherCamera = () => {
    cleanupCamera();
  };

  // Function to analyze audio intensity
  const analyzeAudio = useCallback(() => {
    if (!audioAnalyserRef.current || !audioStreamRef.current) return;
    
    const analyser = audioAnalyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);
    
    // Calculate average amplitude
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.abs(dataArray[i] - 128);
    }
    const average = sum / dataArray.length;
    
    // Normalize to 0-100 range
    const intensity = Math.min(100, Math.max(0, Math.floor(average * 2)));
    setTeacherAudioIntensity(intensity);
    
    // Continue analysis
    audioAnimationRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // Handle teacher microphone start
  const handleStartTeacherMicrophone = async () => {
    try {
      setTeacherMicrophoneError(null);
      
      // Check browser support first
      const browserError = checkBrowserSupport();
      if (browserError) {
        setTeacherMicrophoneError(browserError);
        return;
      }
      
      // Get existing audio stream or create new one
      let stream: MediaStream;
      if (audioStreamRef.current) {
        stream = audioStreamRef.current;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true
        });
        audioStreamRef.current = stream;
      }
      
      // Set up audio analysis
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      
      // Start analysis
      analyzeAudio();
      
      // Enable microphone
      setTeacherMicrophoneEnabled(true);
      
    } catch (error: any) {
      console.error('❌ Error accessing microphone:', error);
      let errorMessage = 'Failed to access microphone.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone constraints could not be satisfied. Please try with different settings.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setTeacherMicrophoneError(errorMessage);
    }
  };

  // Handle teacher microphone stop
  const handleStopTeacherMicrophone = () => {
    cleanupMicrophone();
  };

  // Video lifecycle management
  useEffect(() => {
    const video = videoRef.current;
    const stream = videoStreamRef.current;
    
    // Only proceed if we have both video element and stream, and camera is enabled
    if (!video || !stream || !teacherCameraEnabled) return;

    const handleLoadedMetadata = () => {
      if (isMountedRef.current) {
        setTeacherStreamActive(true);
      }
    };

    const handleCanPlay = () => {
      video.play().catch(e => {
        if (isMountedRef.current) {
          setTeacherCameraError('Video autoplay blocked. Click the play button to start.');
        }
      });
    };

    const handlePlay = () => {
      if (isMountedRef.current) {
        setTeacherStreamActive(true);
        setTeacherCameraError(null);
      }
    };

    const handleError = (e: Event) => {
      console.error('❌ Video error:', e);
      if (isMountedRef.current) {
        setTeacherCameraError('Video playback failed. Please try restarting the camera.');
      }
    };

    // Assign stream to video element
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
  }, [teacherCameraEnabled]);

  const handleStartClass = async () => {
    try {
      await startClass(classId);
      setClassState(prev => ({
        ...prev,
        status: 'active',
        startedAt: new Date(),
      }));
    } catch (error) {
      console.error('Failed to start class:', error);
    }
  };

  const handleEndClass = async () => {
    try {
      await endClass(classId);
      setClassState(prev => ({
        ...prev,
        status: 'ended',
        endedAt: new Date(),
      }));
      // Stop teacher camera and microphone when class ends
      if (teacherCameraEnabled) {
        handleStopTeacherCamera();
      }
      if (teacherMicrophoneEnabled) {
        handleStopTeacherMicrophone();
      }
    } catch (error) {
      console.error('Failed to end class:', error);
    }
  };

  const handlePauseClass = async () => {
    try {
      if (classState.status === 'active') {
        await pauseClass(classId);
        setClassState(prev => ({
          ...prev,
          status: 'paused',
        }));
      } else if (classState.status === 'paused') {
        await resumeClass(classId);
        setClassState(prev => ({
          ...prev,
          status: 'active',
        }));
      }
    } catch (error) {
      console.error('Failed to pause/resume class:', error);
    }
  };

  const handleToggleStudentCamera = async (studentId: string, enable: boolean) => {
    try {
      if (enable) {
        await enableStudentCamera(classId, studentId);
      } else {
        await disableStudentCamera(classId, studentId);
      }
      
      // In a real implementation, you would update the student's camera status
      console.log(`Camera ${enable ? 'enabled' : 'disabled'} for student ${studentId}`);
    } catch (error) {
      console.error(`Failed to ${enable ? 'enable' : 'disable'} camera for student ${studentId}:`, error);
    }
  };

  const handleToggleStudentMicrophone = async (studentId: string, enable: boolean) => {
    try {
      if (enable) {
        await enableStudentMicrophone(classId, studentId);
      } else {
        await disableStudentMicrophone(classId, studentId);
      }
      
      // In a real implementation, you would update the student's microphone status
      console.log(`Microphone ${enable ? 'enabled' : 'disabled'} for student ${studentId}`);
    } catch (error) {
      console.error(`Failed to ${enable ? 'enable' : 'disable'} microphone for student ${studentId}:`, error);
    }
  };

  const activeStudentsCount = students.filter(student => student.isActive).length;
  const focusStudentsCount = students.filter(student => student.isInFocus).length;
  const cameraEnabledStudentsCount = students.filter(student => student.hasCameraEnabled).length;
  const microphoneEnabledStudentsCount = students.filter(student => student.hasMicrophoneEnabled).length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading students...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Teacher Microphone Status with Intensity Indicator
  const renderMicIntensityIcon = () => {
    if (teacherAudioIntensity > 70) {
      return <Volume2 className="w-4 h-4 text-green-500" />;
    } else if (teacherAudioIntensity > 30) {
      return <Volume1 className="w-4 h-4 text-yellow-500" />;
    } else if (teacherAudioIntensity > 0) {
      return <Volume className="w-4 h-4 text-blue-500" />;
    } else {
      return <VolumeX className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full glass hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{className}</CardTitle>
              <p className="text-sm text-muted-foreground">{classSubject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={classState.status === 'active' ? 'default' : classState.status === 'paused' ? 'secondary' : 'destructive'}
              className={`${
                classState.status === 'active'
                  ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
                  : classState.status === 'paused'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              } font-bold`}
            >
              {classState.status === 'active' && (
                <div className="w-2 h-2 rounded-full bg-white mr-1" />
              )}
              {classState.status === 'active' ? 'LIVE' : classState.status === 'paused' ? 'PAUSED' : 'ENDED'}
            </Badge>
          </div>
        </div>

        {/* Class Statistics */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{activeStudentsCount} active</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{focusStudentsCount} in focus</span>
          </div>
          {userType === 'teacher' && (
            <>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Camera className="w-4 h-4" />
                <span>{cameraEnabledStudentsCount} with camera</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mic className="w-4 h-4" />
                <span>{microphoneEnabledStudentsCount} with mic</span>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Class Controls */}
        <div className="flex flex-wrap gap-2">
          {classState.status === 'ended' ? (
            <Button onClick={handleStartClass} className="flex-1 min-w-[120px]">
              <Play className="w-4 h-4 mr-2" />
              Start Class
            </Button>
          ) : (
            <>
              <Button
                onClick={handleEndClass}
                variant="destructive"
                className="flex-1 min-w-[120px]"
              >
                <Square className="w-4 h-4 mr-2" />
                End Class
              </Button>
              <Button
                onClick={handlePauseClass}
                variant="outline"
                className="flex-1 min-w-[120px]"
              >
                {classState.status === 'paused' ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              
              {/* Teacher Camera Controls */}
              {userType === 'teacher' && (
                !teacherCameraEnabled ? (
                  <Button
                    onClick={handleStartTeacherCamera}
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTeacherCamera}
                    variant="destructive"
                    className="flex-1 min-w-[120px]"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Stop Camera
                  </Button>
                )
              )}
              
              {/* Teacher Microphone Controls */}
              {userType === 'teacher' && (
                !teacherMicrophoneEnabled ? (
                  <Button
                    onClick={handleStartTeacherMicrophone}
                    variant="outline"
                    className="flex-1 min-w-[120px]"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Mic
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopTeacherMicrophone}
                    variant="destructive"
                    className="flex-1 min-w-[120px]"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Mic
                  </Button>
                )
              )}
            </>
          )}
        </div>

        {/* Teacher Camera Preview */}
        {userType === 'teacher' && teacherCameraEnabled && (
          <div className="mt-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Your Camera Preview</h3>
            <div className="relative max-w-md mx-auto">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg border"
                style={{ 
                  transform: 'scaleX(-1)',
                  minHeight: '180px',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
              />
              <Badge className={`absolute top-2 left-2 text-white ${
                teacherStreamActive ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                {teacherStreamActive ? 'Live' : 'Loading...'}
              </Badge>
            </div>
            
            {teacherCameraError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{teacherCameraError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Teacher Microphone Status with Intensity Indicator */}
        {userType === 'teacher' && teacherMicrophoneEnabled && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {renderMicIntensityIcon()}
              <span>Your microphone is active</span>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-4 bg-gray-300 rounded-sm" style={{ opacity: teacherAudioIntensity > 10 ? 1 : 0.3 }}></div>
                <div className="w-2 h-6 bg-gray-300 rounded-sm" style={{ opacity: teacherAudioIntensity > 30 ? 1 : 0.3 }}></div>
                <div className="w-2 h-8 bg-gray-300 rounded-sm" style={{ opacity: teacherAudioIntensity > 50 ? 1 : 0.3 }}></div>
                <div className="w-2 h-10 bg-gray-300 rounded-sm" style={{ opacity: teacherAudioIntensity > 70 ? 1 : 0.3 }}></div>
              </div>
              <span className="text-xs">({teacherAudioIntensity}%)</span>
            </div>
            
            {teacherMicrophoneError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{teacherMicrophoneError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Students List */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            Students ({students.length})
          </h3>

          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students in this class yet
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Attendance Indicator */}
                    <div className="flex-shrink-0">
                      {student.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{student.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Joined {Math.floor((Date.now() - student.joinedAt.getTime()) / 60000)}m ago
                      </div>
                    </div>
                  </div>

                  {/* Camera, Microphone and Focus Status */}
                  <div className="flex items-center gap-2">
                    {userType === 'teacher' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStudentMicrophone(student.id, !student.hasMicrophoneEnabled)}
                          className={student.hasMicrophoneEnabled ? "text-green-500" : "text-gray-400"}
                        >
                          {student.hasMicrophoneEnabled ? (
                            <Mic className="w-4 h-4" />
                          ) : (
                            <MicOff className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStudentCamera(student.id, !student.hasCameraEnabled)}
                          className={student.hasCameraEnabled ? "text-green-500" : "text-gray-400"}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                        
                        {/* Student Audio Intensity Indicator */}
                        {student.hasMicrophoneEnabled && (
                          <div className="flex items-center ml-2">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-2 bg-gray-400 rounded-sm" style={{ 
                                opacity: (student.audioIntensity || 0) > 10 ? 1 : 0.3,
                                backgroundColor: (student.audioIntensity || 0) > 70 ? '#10B981' : 
                                                (student.audioIntensity || 0) > 30 ? '#F59E0B' : '#6B7280'
                              }}></div>
                              <div className="w-1 h-3 bg-gray-400 rounded-sm" style={{ 
                                opacity: (student.audioIntensity || 0) > 30 ? 1 : 0.3,
                                backgroundColor: (student.audioIntensity || 0) > 70 ? '#10B981' : 
                                                (student.audioIntensity || 0) > 30 ? '#F59E0B' : '#6B7280'
                              }}></div>
                              <div className="w-1 h-4 bg-gray-400 rounded-sm" style={{ 
                                opacity: (student.audioIntensity || 0) > 50 ? 1 : 0.3,
                                backgroundColor: (student.audioIntensity || 0) > 70 ? '#10B981' : 
                                                (student.audioIntensity || 0) > 30 ? '#F59E0B' : '#6B7280'
                              }}></div>
                              <div className="w-1 h-5 bg-gray-400 rounded-sm" style={{ 
                                opacity: (student.audioIntensity || 0) > 70 ? 1 : 0.3,
                                backgroundColor: (student.audioIntensity || 0) > 70 ? '#10B981' : 
                                                (student.audioIntensity || 0) > 30 ? '#F59E0B' : '#6B7280'
                              }}></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {userType === 'student' && student.hasMicrophoneEnabled && (
                      <Mic className="w-4 h-4 text-green-500" />
                    )}
                    
                    {userType === 'student' && student.hasCameraEnabled && (
                      <Camera className="w-4 h-4 text-green-500" />
                    )}
                    
                    <Badge
                      variant={student.isInFocus ? 'default' : 'secondary'}
                      className={`${
                        student.isInFocus
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                    >
                      {student.isInFocus ? 'In Focus' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};