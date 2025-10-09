import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Camera, 
  Trophy,
  Star,
  Medal,
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Image as ImageIcon
} from "lucide-react";
import { GroupSession } from "@/components/group/GroupSession";
import { 
  getPublicRooms, 
  createRoom, 
  joinRoom,
  createStudyCheckIn,
  submitPhotoVerification,
  votePhotoVerification,
  getLeaderboard,
  getUserAchievements,
  createStudyGroup
} from "@/config/firebase";

interface EnhancedRoom {
  name: string;
  members: number;
  isStudying: boolean;
  activeMembers: string[];
  description: string;
  roomId?: string;
  verificationRequired: boolean;
  checkInsToday: number;
  studyStreak: number;
  tags: string[];
}

interface Achievement {
  title: string;
  description: string;
  points: number;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  badge?: string;
}

export const EnhancedGroupsTab = () => {
  const { user } = useUser();
  const [activeGroupSession, setActiveGroupSession] = useState<{
    groupId: string;
    groupName: string;
  } | null>(null);
  
  const [rooms, setRooms] = useState<EnhancedRoom[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showPhotoCheckIn, setShowPhotoCheckIn] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [checkInProgress, setCheckInProgress] = useState('');

  // Mock enhanced data
  const mockRooms: EnhancedRoom[] = [
    {
      name: "Focus Warriors",
      members: 12,
      isStudying: true,
      activeMembers: ["Alex", "Sarah", "Mike"],
      description: "Intense study sessions with photo verification",
      verificationRequired: true,
      checkInsToday: 8,
      studyStreak: 5,
      tags: ["competitive", "verified", "focus"]
    },
    {
      name: "Calm Studiers",
      members: 6,
      isStudying: false,
      activeMembers: [],
      description: "Peaceful group study environment",
      verificationRequired: false,
      checkInsToday: 3,
      studyStreak: 2,
      tags: ["peaceful", "flexible", "beginner"]
    },
    {
      name: "Night Hawks",
      members: 15,
      isStudying: true,
      activeMembers: ["Emma", "Jack", "Lisa", "Tom"],
      description: "Late night study squad with achievements",
      verificationRequired: true,
      checkInsToday: 12,
      studyStreak: 8,
      tags: ["night-owl", "achievements", "hardcore"]
    },
  ];

  const mockAchievements: Achievement[] = [
    {
      title: "Study Streak Master",
      description: "Maintained a 7-day study streak",
      points: 100,
      unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rarity: 'epic'
    },
    {
      title: "Verification Veteran",
      description: "Completed 50 photo verifications",
      points: 75,
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rarity: 'rare'
    },
    {
      title: "Community Helper",
      description: "Voted on 100 verification requests",
      points: 50,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rarity: 'common'
    }
  ];

  const mockLeaderboard: LeaderboardEntry[] = [
    { userId: '1', userName: 'StudyMaster', score: 2540, rank: 1, badge: '👑' },
    { userId: '2', userName: 'FocusQueen', score: 2120, rank: 2, badge: '🥈' },
    { userId: '3', userName: 'NightOwl', score: 1890, rank: 3, badge: '🥉' },
    { userId: '4', userName: 'BookWorm', score: 1650, rank: 4 },
    { userId: '5', userName: 'GrindTime', score: 1420, rank: 5 },
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load rooms (enhanced with community data)
      try {
        const result = await getPublicRooms({ 
          limit: 10,
          userId: user?.id || 'demo-user'
        });
        const backendRooms = (result.data as any).rooms || [];
        const enhancedRooms = backendRooms.map((room: any) => ({
          name: room.name,
          members: room.participants || 0,
          isStudying: room.status === 'active',
          activeMembers: [],
          description: room.description || room.subject || "Study session",
          roomId: room.id,
          verificationRequired: Math.random() > 0.5, // Mock for now
          checkInsToday: Math.floor(Math.random() * 20),
          studyStreak: Math.floor(Math.random() * 10),
          tags: ['study', 'focus']
        }));
        setRooms(enhancedRooms.length > 0 ? enhancedRooms : mockRooms);
      } catch (err) {
        console.error('Failed to load rooms:', err);
        setRooms(mockRooms);
      }

      // Load achievements
      try {
        const achievementsResult = await getUserAchievements({ 
          userId: user?.id || 'demo-user' 
        });
        const userAchievements = (achievementsResult.data as any).achievements || [];
        setAchievements(userAchievements.length > 0 ? userAchievements : mockAchievements);
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setAchievements(mockAchievements);
      }

      // Load leaderboard
      try {
        const leaderboardResult = await getLeaderboard({ 
          type: 'weekly',
          category: 'study_time',
          limit: 10
        });
        const leaderboardData = (leaderboardResult.data as any).leaderboard?.entries || [];
        setLeaderboard(leaderboardData.length > 0 ? leaderboardData : mockLeaderboard);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setLeaderboard(mockLeaderboard);
      }

    } catch (err) {
      console.error('Failed to load community data:', err);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterGroup = async (roomName: string, index: number) => {
    const room = rooms[index];
    
    if (room.roomId) {
      try {
        setLoading(true);
        const result = await joinRoom({ 
          roomId: room.roomId,
          userId: user?.id || 'demo-user'
        });
        console.log('✅ Joined room:', result.data);
        
        setActiveGroupSession({
          groupId: room.roomId,
          groupName: roomName
        });
      } catch (error) {
        console.error('❌ Failed to join room:', error);
        setError('Failed to join room');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveGroupSession({
        groupId: `group-${index}`,
        groupName: roomName
      });
    }
  };

  const handleCreateCheckIn = async (roomId: string) => {
    try {
      setCheckInProgress('Creating check-in...');
      
      const checkIn = {
        roomId,
        checkInType: 'verification' as const,
        studyProgress: {
          tasksCompleted: Math.floor(Math.random() * 5),
          currentTask: "Working on calculus problems",
          notes: "Making good progress"
        },
        userId: user?.id || 'demo-user'
      };

      const result = await createStudyCheckIn(checkIn);
      setCheckInProgress('Check-in created! +10 points');
      
      setTimeout(() => setCheckInProgress(''), 3000);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to create check-in:', error);
      setCheckInProgress('Failed to create check-in');
      setTimeout(() => setCheckInProgress(''), 3000);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  const handleSubmitPhoto = async () => {
    if (!selectedPhoto || !activeGroupSession) return;

    try {
      setCheckInProgress('Uploading photo for verification...');
      
      // In a real implementation, you'd upload to storage first
      const mockPhotoUrl = URL.createObjectURL(selectedPhoto);
      
      const result = await submitPhotoVerification({
        checkInId: 'mock-checkin-id',
        photoUrl: mockPhotoUrl,
        userId: user?.id || 'demo-user'
      });
      
      setCheckInProgress('Photo submitted for peer verification! +15 points');
      setShowPhotoCheckIn(false);
      setSelectedPhoto(null);
      
      setTimeout(() => setCheckInProgress(''), 3000);
    } catch (error) {
      console.error('Failed to submit photo:', error);
      setCheckInProgress('Failed to submit photo');
      setTimeout(() => setCheckInProgress(''), 3000);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500';
      case 'epic': return 'text-purple-500';
      case 'rare': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return Crown;
      case 'epic': return Star;
      case 'rare': return Medal;
      default: return Award;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading community data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show active group session
  if (activeGroupSession) {
    return (
      <div className="relative">
        <GroupSession
          groupId={activeGroupSession.groupId}
          groupName={activeGroupSession.groupName}
          onLeaveGroup={() => setActiveGroupSession(null)}
        />
        
        {/* Enhanced controls overlay */}
        <div className="fixed bottom-4 right-4 space-y-2">
          <Button
            onClick={() => handleCreateCheckIn(activeGroupSession.groupId)}
            className="rounded-full shadow-lg"
            disabled={!!checkInProgress}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check In
          </Button>
          
          <Button
            onClick={() => setShowPhotoCheckIn(true)}
            variant="outline"
            className="rounded-full shadow-lg"
          >
            <Camera className="w-4 h-4 mr-2" />
            Photo
          </Button>
        </div>

        {checkInProgress && (
          <div className="fixed top-4 right-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>{checkInProgress}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Photo check-in dialog */}
        <Dialog open={showPhotoCheckIn} onOpenChange={setShowPhotoCheckIn}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Photo Check-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Take a photo of your study setup for peer verification
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {selectedPhoto ? (
                  <div className="space-y-2">
                    <img 
                      src={URL.createObjectURL(selectedPhoto)} 
                      alt="Selected" 
                      className="max-w-full max-h-32 mx-auto rounded"
                    />
                    <p className="text-sm">{selectedPhoto.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500">Upload a photo of your study space</p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="mt-2"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSubmitPhoto} disabled={!selectedPhoto} className="flex-1">
                  Submit for Verification
                </Button>
                <Button variant="outline" onClick={() => setShowPhotoCheckIn(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Community</h1>
          <p className="text-muted-foreground">Join groups, earn achievements, compete on leaderboards</p>
        </div>
        <Button onClick={() => setShowCreateRoom(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Room
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rooms">
            <Users className="w-4 h-4 mr-2" />
            Study Rooms
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Medal className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Target className="w-4 h-4 mr-2" />
            Challenges
          </TabsTrigger>
        </TabsList>

        {/* Study Rooms Tab */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="grid gap-4">
            {rooms.map((room, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{room.name}</h3>
                      {room.verificationRequired && (
                        <Badge variant="secondary" className="text-xs">
                          <Camera className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge variant={room.isStudying ? "default" : "secondary"} className="text-xs">
                        {room.isStudying ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{room.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.members} members
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {room.checkInsToday} check-ins today
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {room.studyStreak} day streak
                      </span>
                    </div>
                    
                    <div className="flex gap-1 mt-2">
                      {room.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {room.activeMembers.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {room.activeMembers.slice(0, 2).join(", ")}
                        {room.activeMembers.length > 2 && ` +${room.activeMembers.length - 2}`}
                      </div>
                    )}
                    <Button 
                      onClick={() => handleEnterGroup(room.name, index)}
                      variant={room.isStudying ? "default" : "outline"}
                      size="sm"
                    >
                      Join Room
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement, index) => {
              const IconComponent = getRarityIcon(achievement.rarity);
              return (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-primary/10 ${getRarityColor(achievement.rarity)}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {achievement.unlockedAt.toLocaleDateString()}
                        </span>
                        <span className="font-medium text-primary">+{achievement.points} points</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <Card key={entry.userId} className={`p-4 ${index < 3 ? 'border-primary/50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-muted-foreground">#{entry.rank}</span>
                    {entry.badge && <span className="text-lg">{entry.badge}</span>}
                  </div>
                  
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.userAvatar} />
                    <AvatarFallback>{entry.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{entry.userName}</h4>
                    <p className="text-sm text-muted-foreground">{entry.score} points this week</p>
                  </div>
                  
                  {index < 3 && (
                    <Badge variant="secondary">
                      Top {index + 1}
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4">
          <Card className="p-6 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Community Challenges</h3>
            <p className="text-muted-foreground mb-4">
              Join weekly and monthly challenges to earn exclusive rewards
            </p>
            <Button>
              <Trophy className="w-4 h-4 mr-2" />
              View Active Challenges
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};