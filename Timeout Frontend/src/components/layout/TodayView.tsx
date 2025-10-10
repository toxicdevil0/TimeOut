import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Clock, 
  Calendar,
  Target,
  TrendingUp,
  Play,
  Plus,
  BookOpen,
  Coffee,
  Users,
  Award,
  CheckCircle2,
  Circle,
  Timer,
  Pause,
  RotateCcw
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  estimatedPomodoros: number;
  category: string;
  timer?: {
    isRunning: boolean;
    timeLeft: number;
    totalTime: number;
  };
}

interface Session {
  id: string;
  type: "focus" | "break";
  duration: number;
  completed: boolean;
  startTime: string;
  subject?: string;
}

export const TodayView = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete React component refactoring",
      completed: false,
      priority: "high",
      estimatedPomodoros: 3,
      category: "Development",
      timer: {
        isRunning: false,
        timeLeft: 25 * 60, // 25 minutes in seconds
        totalTime: 25 * 60
      }
    },
    {
      id: "2", 
      title: "Review pull requests",
      completed: true,
      priority: "medium",
      estimatedPomodoros: 2,
      category: "Code Review"
    },
    {
      id: "3",
      title: "Write documentation for new features",
      completed: false,
      priority: "medium",
      estimatedPomodoros: 2,
      category: "Documentation",
      timer: {
        isRunning: false,
        timeLeft: 25 * 60, // 25 minutes in seconds
        totalTime: 25 * 60
      }
    },
    {
      id: "4",
      title: "Team standup meeting",
      completed: true,
      priority: "low",
      estimatedPomodoros: 1,
      category: "Meeting"
    }
  ]);

  const [sessions] = useState<Session[]>([
    {
      id: "1",
      type: "focus",
      duration: 25,
      completed: true,
      startTime: "09:00",
      subject: "React Development"
    },
    {
      id: "2",
      type: "break",
      duration: 5,
      completed: true,
      startTime: "09:25"
    },
    {
      id: "3",
      type: "focus",
      duration: 25,
      completed: true,
      startTime: "09:30",
      subject: "Code Review"
    },
    {
      id: "4",
      type: "focus",
      duration: 25,
      completed: false,
      startTime: "10:30",
      subject: "Documentation"
    }
  ]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const startTaskTimer = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            timer: {
              isRunning: true,
              timeLeft: task.timer?.timeLeft ?? 25 * 60, // 25 minutes in seconds
              totalTime: task.timer?.totalTime ?? 25 * 60
            }
          } 
        : task
    ));
  };

  const pauseTaskTimer = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId && task.timer
        ? { 
            ...task, 
            timer: {
              ...task.timer,
              isRunning: false
            }
          } 
        : task
    ));
  };

  const resetTaskTimer = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId && task.timer
        ? { 
            ...task, 
            timer: {
              ...task.timer,
              isRunning: false,
              timeLeft: task.timer.totalTime
            }
          } 
        : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const totalPomodoros = sessions.filter(s => s.type === "focus" && s.completed).length;
  const focusTime = totalPomodoros * 25;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks</p>
                <p className="text-xl font-bold">{completedTasks.length}/{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Timer className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pomodoros</p>
                <p className="text-xl font-bold">{totalPomodoros}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Focus Time</p>
                <p className="text-xl font-bold">{focusTime}m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productivity</p>
                <p className="text-xl font-bold">{Math.round((completedTasks.length / tasks.length) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <Card className="lg:col-span-2 border-border shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Today's Tasks
                </CardTitle>
                <CardDescription>
                  {completedTasks.length} of {tasks.length} tasks completed
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  task.completed 
                    ? "bg-muted/30 border-muted" 
                    : "bg-background border-border hover:bg-accent/20"
                }`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="h-5 w-5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`font-medium truncate ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}>
                      {task.title}
                    </h4>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{task.category}</span>
                    <span className="flex items-center">
                      <Timer className="mr-1 h-3 w-3" />
                      {task.estimatedPomodoros} pomodoros
                    </span>
                  </div>
                </div>

                {!task.completed && task.timer && (
                  <div className="flex items-center space-x-1">
                    {!task.timer.isRunning ? (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => startTaskTimer(task.id)}
                        title="Start timer"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => pauseTaskTimer(task.id)}
                        title="Pause timer"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => resetTaskTimer(task.id)}
                      title="Reset timer"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>Daily Progress</span>
                <span>{completedTasks.length}/{tasks.length}</span>
              </div>
              <Progress value={(completedTasks.length / tasks.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule & Sessions */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>Your focus sessions timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session, index) => (
                <div key={session.id} className="flex items-center space-x-3">
                  <div className="text-sm text-muted-foreground w-12">
                    {session.startTime}
                  </div>
                  
                  <div className={`w-3 h-3 rounded-full ${
                    session.completed ? "bg-success" : "bg-muted"
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {session.type === "focus" ? (
                        <BookOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Coffee className="h-4 w-4 text-success" />
                      )}
                      <span className={`text-sm font-medium ${
                        session.completed ? "" : "text-muted-foreground"
                      }`}>
                        {session.type === "focus" ? "Focus Session" : "Break"}
                      </span>
                    </div>
                    {session.subject && (
                      <p className="text-xs text-muted-foreground">{session.subject}</p>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {session.duration}m
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Start Focus Session
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Join Study Group
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <Award className="mr-2 h-4 w-4" />
                View Achievements
              </Button>
            </CardContent>
          </Card>

          {/* Today's Achievements */}
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Today's Wins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-medium">Early Bird</p>
                  <p className="text-xs text-muted-foreground">Started before 9 AM</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Focus Streak</p>
                  <p className="text-xs text-muted-foreground">3 sessions completed</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-muted/50 rounded-lg">
                <Circle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Task Master</p>
                  <p className="text-xs text-muted-foreground">Complete 5 tasks (3/5)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};