import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Coffee, 
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Zap
} from "lucide-react";
import { useTokens } from "@/contexts/TokenContext";
import { useTokenNotifications } from "@/hooks/useTokenNotifications";
import { TokenChangeAnimation } from "@/components/tokens/TokenDisplay";

type TimerPhase = "focus" | "shortBreak" | "longBreak";
type TimerState = "idle" | "running" | "paused";

export const TimerView = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const { awardTokens } = useTokens();
  const { notifications, showNotification, hideNotification } = useTokenNotifications();
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>("focus");
  const [sessionCount, setSessionCount] = useState(0);

  // Timer durations in minutes
  const durations = {
    focus: 25,
    shortBreak: 5,
    longBreak: 15
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handlePhaseComplete();
    }

    return () => clearInterval(interval);
  }, [timerState, timeLeft]);

  const handlePhaseComplete = async () => {
    setTimerState("idle");
    
    if (currentPhase === "focus") {
      // Award tokens for completed focus session
      const sessionDuration = durations.focus;
      const baseTokens = sessionDuration; // 1 token per minute
      const bonusTokens = Math.floor(sessionDuration * 0.4); // 40% bonus for completion
      const totalTokens = baseTokens + bonusTokens;
      
      try {
        await awardTokens(totalTokens, `Focus session completed (${sessionDuration} min)`, 'focus', {
          duration: sessionDuration,
          sessionId: `timer-${Date.now()}`
        });
        
        showNotification(totalTokens, 'earned', `${sessionDuration} min focus session`);
      } catch (error) {
        console.error('Failed to award tokens:', error);
        showNotification(totalTokens, 'earned', `${sessionDuration} min focus session (offline)`);
      }
      
      setSessionCount(count => {
        const newCount = count + 1;
        
        // Award streak bonus every 4 sessions
        if (newCount % 4 === 0) {
          const streakBonus = 100;
          awardTokens(streakBonus, `4-session streak bonus!`, 'streak').then(() => {
            showNotification(streakBonus, 'earned', 'Streak bonus!');
          }).catch(error => {
            console.error('Failed to award streak bonus:', error);
            showNotification(streakBonus, 'earned', 'Streak bonus! (offline)');
          });
        }
        
        return newCount;
      });
      
      // Switch to break (short break or long break every 4 sessions)
      const nextPhase = sessionCount % 4 === 3 ? "longBreak" : "shortBreak";
      setCurrentPhase(nextPhase);
      setTimeLeft(durations[nextPhase] * 60);
    } else {
      // Switch back to focus
      setCurrentPhase("focus");
      setTimeLeft(durations.focus * 60);
    }
  };

  const startTimer = () => setTimerState("running");
  const pauseTimer = () => setTimerState("paused");
  const resetTimer = () => {
    setTimerState("idle");
    setTimeLeft(durations[currentPhase] * 60);
  };

  const switchPhase = (phase: TimerPhase) => {
    setCurrentPhase(phase);
    setTimeLeft(durations[phase] * 60);
    setTimerState("idle");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = (phase: TimerPhase) => {
    const info = {
      focus: { label: "Focus Session", icon: BookOpen, color: "bg-primary" },
      shortBreak: { label: "Short Break", icon: Coffee, color: "bg-success" },
      longBreak: { label: "Long Break", icon: Coffee, color: "bg-warning" }
    };
    return info[phase];
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const totalDuration = durations[currentPhase] * 60;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Token Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-2">
        {notifications.map(notification => (
          <TokenChangeAnimation
            key={notification.id}
            amount={notification.amount}
            type={notification.type}
            reason={notification.reason}
            visible={notification.visible}
            onAnimationEnd={() => hideNotification(notification.id)}
          />
        ))}
      </div>
      {/* Main Timer Card */}
      <Card className="border-border shadow-card">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Phase Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <phaseInfo.icon className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-sm">
                {phaseInfo.label}
              </Badge>
              {currentPhase === "focus" && (
                <Badge variant="outline" className="text-sm">
                  Session {sessionCount + 1}
                </Badge>
              )}
            </div>

            {/* Timer Display */}
            <div className="space-y-4">
              <div className="text-6xl md:text-7xl font-mono font-bold text-foreground">
                {formatTime(timeLeft)}
              </div>
              
              {/* Progress Circle */}
              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/30"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                    className="text-primary transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-medium text-muted-foreground">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Complete
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-4">
              {timerState === "running" ? (
                <Button onClick={pauseTimer} size="lg" variant="outline">
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </Button>
              ) : (
                <Button onClick={startTimer} size="lg" className="bg-primary hover:bg-primary/90">
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </Button>
              )}
              
              <Button onClick={resetTimer} size="lg" variant="outline">
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Selection & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-card">
          <CardHeader>
            <CardTitle>Session Types</CardTitle>
            <CardDescription>Choose your focus session type</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentPhase} onValueChange={(value) => switchPhase(value as TimerPhase)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="focus">Focus</TabsTrigger>
                <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                <TabsTrigger value="longBreak">Long Break</TabsTrigger>
              </TabsList>
              
              <TabsContent value="focus" className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Focus Session</h4>
                      <p className="text-sm text-muted-foreground">Deep work and concentration</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{durations.focus} minutes</div>
                    <div className="text-sm text-muted-foreground">Recommended</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="shortBreak" className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-5 w-5 text-success" />
                    <div>
                      <h4 className="font-medium">Short Break</h4>
                      <p className="text-sm text-muted-foreground">Quick rest between sessions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{durations.shortBreak} minutes</div>
                    <div className="text-sm text-muted-foreground">Refresh</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="longBreak" className="mt-4 space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-5 w-5 text-warning" />
                    <div>
                      <h4 className="font-medium">Long Break</h4>
                      <p className="text-sm text-muted-foreground">Extended rest after 4 sessions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{durations.longBreak} minutes</div>
                    <div className="text-sm text-muted-foreground">Recharge</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="font-medium">{sessionCount}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm">Daily Goal</span>
              </div>
              <span className="font-medium">8</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Focus Time</span>
              </div>
              <span className="font-medium">{sessionCount * 25}m</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Tokens Earned</span>
              </div>
              <span className="font-medium text-yellow-600">{sessionCount * 35} FP</span>
            </div>

            <div className="pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Progress</span>
                <span>{sessionCount}/8</span>
              </div>
              <Progress value={(sessionCount / 8) * 100} className="h-2" />
            </div>

            <Button variant="outline" size="sm" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Timer Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};