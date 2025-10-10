import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Timer, 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Play,
  Award,
  Zap
} from "lucide-react";
import { useTokens } from "@/contexts/TokenContext";
import { TokenDisplay } from "../tokens/TokenDisplay";
import { TokenStatsDashboard } from "../tokens/TokenStatsDashboard";
import { TokenShop } from "../tokens/TokenShop";

export const DashboardOverview = () => {
  const { tokens } = useTokens();
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Good morning, Student!</h1>
          <p className="text-muted-foreground">Ready to focus? You have 3 study sessions planned today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <TokenShop />
          <Button className="bg-primary hover:bg-primary/90">
            <Play className="mr-2 h-4 w-4" />
            Start Focus Session
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Focus</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h 45m</div>
            <p className="text-xs text-muted-foreground">+15m from yesterday</p>
            <Progress value={68} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Personal best!</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4/6</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Points</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <TokenDisplay 
                amount={tokens.availableTokens} 
                variant="minimal" 
                showIcon={false}
                showLabel={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">+{tokens.todayTokens} today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your study sessions and tasks for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-accent/30 rounded-lg">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Mathematics Study Session</h4>
                <p className="text-sm text-muted-foreground">10:00 AM - 11:30 AM</p>
              </div>
              <div className="text-sm font-medium text-primary">In Progress</div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 hover:bg-accent/20 rounded-lg transition-colors">
              <div className="w-2 h-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Physics Group Study</h4>
                <p className="text-sm text-muted-foreground">2:00 PM - 3:30 PM</p>
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
            
            <div className="flex items-center space-x-4 p-3 hover:bg-accent/20 rounded-lg transition-colors">
              <div className="w-2 h-8 bg-muted rounded-full"></div>
              <div className="flex-1">
                <h4 className="font-medium">Chemistry Review</h4>
                <p className="text-sm text-muted-foreground">4:00 PM - 5:00 PM</p>
              </div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Achievements */}
        <div className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Focus Time</span>
                    <span>18h / 20h</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sessions</span>
                    <span>24 / 28</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Group Study</span>
                    <span>6 / 8</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">7-Day Streak</h4>
                  <p className="text-xs text-muted-foreground">Consistent daily focus</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">20+ Hours</h4>
                  <p className="text-xs text-muted-foreground">This week's focus time</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Study Leader</h4>
                  <p className="text-xs text-muted-foreground">Top contributor in groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Token Stats Dashboard */}
      <div className="mt-8">
        <TokenStatsDashboard />
      </div>
    </div>
  );
};