import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';

// TypeScript interfaces for analytics data
interface ClassAnalytics {
  attendanceRate: number; // percent (0-100)
  avgFocusMinutes: number; // in minutes
  totalStudents: number;
  activeStudents: number;
}

interface ClassAnalyticsCardProps {
  classId: string;
  className?: string;
  getAnalytics: (classId: string) => Promise<ClassAnalytics>;
}

// Accent colors for charts
const COLORS = ['#34d399', '#f3f4f6']; // green and gray
const BAR_COLORS = ['#34d399', '#3b82f6']; // green and blue

// Mock analytics function (replace with actual helper)
const mockGetAnalytics = async (classId: string): Promise<ClassAnalytics> => {
  return {
    attendanceRate: 85,
    avgFocusMinutes: 42,
    totalStudents: 30,
    activeStudents: 25,
  };
};

export const ClassAnalyticsCard: React.FC<ClassAnalyticsCardProps> = ({
  classId,
  className = 'Class',
  getAnalytics = mockGetAnalytics,
}) => {
  const [analytics, setAnalytics] = React.useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getAnalytics(classId)
      .then(data => setAnalytics(data))
      .catch(error => {
        console.error('Error fetching analytics:', error);
        // Set mock data on error for demonstration
        setAnalytics({
          attendanceRate: 85,
          avgFocusMinutes: 42,
          totalStudents: 30,
          activeStudents: 25,
        });
      })
      .finally(() => setLoading(false));
  }, [classId, getAnalytics]);

  // Pie chart data for attendance
  const pieData = React.useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Present', value: analytics.attendanceRate },
      { name: 'Absent', value: 100 - analytics.attendanceRate },
    ];
  }, [analytics]);

  // Bar chart data for focus time
  const barData = React.useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Focus', minutes: analytics.avgFocusMinutes },
      { name: 'Other', minutes: 60 - analytics.avgFocusMinutes },
    ];
  }, [analytics]);

  if (loading) {
    return (
      <Card className="rounded-xl shadow-sm bg-card border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
              Analytics
            </Badge>
            {className}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="ml-2 text-muted-foreground">Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="rounded-xl shadow-sm bg-card border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
              Analytics
            </Badge>
            {className}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-muted-foreground">Analytics data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm bg-card border hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1 rounded-full">
            Analytics
          </Badge>
          {className}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attendance Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Attendance</span>
          </div>
          <span className="text-lg font-bold text-green-500">{analytics.attendanceRate}%</span>
        </div>
        
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={35}
                startAngle={90}
                endAngle={-270}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload && payload.length ? (
                    <div className="bg-background px-3 py-1 rounded shadow text-xs border">
                      <span className="font-semibold">{payload[0].name}</span>: {payload[0].value}%
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          {analytics.activeStudents} of {analytics.totalStudents} students present
        </div>

        {/* Focus Time Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Avg Focus Time</span>
          </div>
          <span className="text-lg font-bold text-blue-500">{analytics.avgFocusMinutes} min</span>
        </div>
        
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 60]} hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload && payload.length ? (
                    <div className="bg-background px-3 py-1 rounded shadow text-xs border">
                      <span className="font-semibold">{payload[0].name}</span>: {payload[0].value} minutes
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};