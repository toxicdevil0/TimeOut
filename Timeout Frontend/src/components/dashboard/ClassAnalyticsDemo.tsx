import { ClassAnalyticsCard } from "./ClassAnalyticsCard";

// Mock analytics function - in a real app, this would connect to Firebase
const mockGetAnalytics = async (classId: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return different data based on classId for demo purposes
  switch (classId) {
    case "math-101":
      return {
        attendanceRate: 92,
        avgFocusMinutes: 38,
        totalStudents: 25,
        activeStudents: 23,
      };
    case "physics-201":
      return {
        attendanceRate: 78,
        avgFocusMinutes: 45,
        totalStudents: 20,
        activeStudents: 16,
      };
    case "history-150":
      return {
        attendanceRate: 85,
        avgFocusMinutes: 35,
        totalStudents: 30,
        activeStudents: 25,
      };
    default:
      return {
        attendanceRate: 85,
        avgFocusMinutes: 42,
        totalStudents: 28,
        activeStudents: 24,
      };
  }
};

export const ClassAnalyticsDemo = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Class Analytics Demo</h1>
      <p className="text-muted-foreground">Visualizing attendance and focus metrics for classes</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ClassAnalyticsCard 
          classId="math-101" 
          className="Mathematics 101"
          getAnalytics={mockGetAnalytics}
        />
        <ClassAnalyticsCard 
          classId="physics-201" 
          className="Physics Advanced"
          getAnalytics={mockGetAnalytics}
        />
        <ClassAnalyticsCard 
          classId="history-150" 
          className="History of Art"
          getAnalytics={mockGetAnalytics}
        />
      </div>
    </div>
  );
};