import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Award, 
  Calendar,
  Clock,
  Trophy,
  Star,
  Flame,
  Database,
  Upload,
  Download,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTokens } from '@/contexts/TokenContext';
import { TokenDisplay, TokenStatsCard } from './TokenDisplay';

export const TokenStatsDashboard: React.FC = () => {
  const { 
    tokens, 
    transactions, 
    getTokenHistory, 
    mode, 
    isLoading, 
    lastSyncTime,
    syncToDatabase,
    loadFromDatabase,
    switchToDatabase,
    switchToMock
  } = useTokens();
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Calculate today's goal progress (mock goal of 200 tokens/day)
  const dailyGoal = 200;
  const dailyProgress = Math.min((tokens.todayTokens / dailyGoal) * 100, 100);
  
  // Get recent transactions
  const recentTransactions = getTokenHistory(5);
  
  // Calculate weekly progress
  const weeklyGoal = 1000;
  const weeklyProgress = Math.min((tokens.weeklyTokens / weeklyGoal) * 100, 100);

  // Handle sync to database
  const handleSyncToDatabase = async () => {
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
      await syncToDatabase();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sync to database');
    }
  };

  // Handle load from database
  const handleLoadFromDatabase = async () => {
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
      const hasData = await loadFromDatabase();
      if (hasData) {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setErrorMessage('No token data found in database');
      }
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load from database');
    }
  };

  // Handle switch to database mode
  const handleSwitchToDatabase = async () => {
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
      await switchToDatabase();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to switch to database mode');
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Sync Controls */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Token Data Management
            </div>
            <div className="flex items-center space-x-2">
              {mode === 'database' ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <Wifi className="mr-1 h-3 w-3" />
                  Database Mode
                </Badge>
              ) : (
                <Badge variant="outline">
                  <WifiOff className="mr-1 h-3 w-3" />
                  Mock Mode
                </Badge>
              )}
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </CardTitle>
          <CardDescription>
            Manage your token data storage and synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Status */}
          {syncStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Operation completed successfully!
              </AlertDescription>
            </Alert>
          )}
          
          {syncStatus === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
            <div className="text-center">
              <p className="text-sm font-medium">Current Mode</p>
              <p className="text-lg capitalize">{mode}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Total Transactions</p>
              <p className="text-lg">{transactions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Last Sync</p>
              <p className="text-lg">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {mode === 'mock' ? (
              <>
                <Button 
                  onClick={handleSwitchToDatabase}
                  disabled={isLoading || syncStatus === 'syncing'}
                  className="flex items-center space-x-2"
                >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  <span>Enable Database Mode</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleSyncToDatabase}
                  disabled={isLoading || syncStatus === 'syncing'}
                  className="flex items-center space-x-2"
                >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Sync to Database</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleLoadFromDatabase}
                  disabled={isLoading || syncStatus === 'syncing'}
                  className="flex items-center space-x-2"
                >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Load from Database</span>
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={switchToMock}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <WifiOff className="h-4 w-4" />
                  <span>Switch to Mock Mode</span>
                </Button>
                <Button 
                  onClick={handleSyncToDatabase}
                  disabled={isLoading || syncStatus === 'syncing'}
                  className="flex items-center space-x-2"
                >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Sync to Database</span>
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleLoadFromDatabase}
                  disabled={isLoading || syncStatus === 'syncing'}
                  className="flex items-center space-x-2"
                >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Refresh from Database</span>
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Mock Mode:</strong> Data stored locally in your browser</p>
            <p><strong>Database Mode:</strong> Data synced to Firebase database and available across devices</p>
            <p><strong>Sync to Database:</strong> Save current token data to database</p>
            <p><strong>Load from Database:</strong> Replace current data with database version</p>
          </div>
        </CardContent>
      </Card>

      {/* Token Balance Overview */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Focus Points Balance
          </CardTitle>
          <CardDescription>Your current token economy status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <TokenDisplay 
              amount={tokens.availableTokens} 
              variant="large" 
              animated={true}
              className="text-primary"
            />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-lg font-semibold">{tokens.totalTokens.toLocaleString()} FP</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TokenStatsCard
              title="Today"
              value={tokens.todayTokens}
              icon={Calendar}
              description="Focus points earned today"
              trend={{ value: 15, isPositive: true }}
            />
            <TokenStatsCard
              title="This Week"
              value={tokens.weeklyTokens}
              icon={TrendingUp}
              description="Weekly progress"
            />
            <TokenStatsCard
              title="Current Streak"
              value={tokens.currentStreak}
              icon={Flame}
              description="Days in a row"
            />
            <TokenStatsCard
              title="Rank"
              value={tokens.rank.daily}
              icon={Trophy}
              description="Daily leaderboard"
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Daily Goal
            </CardTitle>
            <CardDescription>Progress toward daily focus target</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm text-muted-foreground">
                {tokens.todayTokens}/{dailyGoal} FP
              </span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {dailyProgress >= 100 ? '🎉 Daily goal achieved!' : `${dailyGoal - tokens.todayTokens} FP remaining`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Weekly Challenge
            </CardTitle>
            <CardDescription>This week's focus challenge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Week Progress</span>
              <span className="text-sm text-muted-foreground">
                {tokens.weeklyTokens}/{weeklyGoal} FP
              </span>
            </div>
            <Progress value={weeklyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {weeklyProgress >= 100 ? '🏆 Weekly challenge completed!' : `${weeklyGoal - tokens.weeklyTokens} FP to go`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest token transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-full ${
                    transaction.type === 'earned' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'earned' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3 rotate-180" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{transaction.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.timestamp.toLocaleDateString()} at {transaction.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={transaction.type === 'earned' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {transaction.category}
                  </Badge>
                  <span className={`font-semibold ${
                    transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount} FP
                  </span>
                </div>
              </div>
            ))}
            
            {recentTransactions.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Complete focus sessions to start earning tokens!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Showcase */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your focus milestones and badges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tokens.achievements.map((achievement) => (
              <div key={achievement} className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium capitalize">
                  {achievement.replace('_', ' ')}
                </p>
                <Badge variant="secondary" className="text-xs mt-1">
                  Unlocked
                </Badge>
              </div>
            ))}
            
            {/* Mock locked achievements */}
            <div className="text-center p-4 bg-muted/20 rounded-lg border border-muted">
              <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Century Club</p>
              <Badge variant="outline" className="text-xs mt-1">
                100 sessions
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-muted/20 rounded-lg border border-muted">
              <Award className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Deep Focus</p>
              <Badge variant="outline" className="text-xs mt-1">
                90min session
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};