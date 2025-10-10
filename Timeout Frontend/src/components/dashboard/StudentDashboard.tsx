import { useState } from "react";
import { MainLayout } from "../layout/MainLayout";
import { DashboardOverview } from "../layout/DashboardOverview";
import { TimerView } from "../layout/TimerView";
import { TodayView } from "../layout/TodayView";
import { SettingsView } from "../layout/SettingsView";
import { ScheduleMaker } from "./tabs/ScheduleMaker";
import { StudyTab } from "./tabs/StudyTab";
import { EnhancedGroupsTab } from "./tabs/EnhancedGroupsTab";
import { ClassesTab } from "./tabs/ClassesTab";
import { DigitalDetoxTab } from "./tabs/DigitalDetoxTab";
import { LiveClassPanel } from "./LiveClassPanel";

// Mock hook for live students - in a real app, this would connect to Firebase
const useLiveStudents = (classId: string) => {
  const mockStudents = [
    {
      id: '1',
      name: 'Alice Johnson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 300000), // 5 minutes ago
      hasCameraEnabled: true,
    },
    {
      id: '2',
      name: 'Bob Smith',
      isActive: true,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 600000), // 10 minutes ago
      hasCameraEnabled: false,
    },
    {
      id: '3',
      name: 'Carol Davis',
      isActive: false,
      isInFocus: false,
      joinedAt: new Date(Date.now() - 900000), // 15 minutes ago
      hasCameraEnabled: true,
    },
    {
      id: '4',
      name: 'David Wilson',
      isActive: true,
      isInFocus: true,
      joinedAt: new Date(Date.now() - 180000), // 3 minutes ago
      hasCameraEnabled: true,
    },
  ];

  return {
    students: mockStudents,
    isLoading: false,
    error: null,
  };
};

// Mock functions for live class controls
const startClass = async (classId: string) => {
  console.log(`Starting class ${classId}`);
};

const endClass = async (classId: string) => {
  console.log(`Ending class ${classId}`);
};

const pauseClass = async (classId: string) => {
  console.log(`Pausing class ${classId}`);
};

const resumeClass = async (classId: string) => {
  console.log(`Resuming class ${classId}`);
};

const toggleAudio = async (classId: string) => {
  console.log(`Toggling audio for class ${classId}`);
};

const toggleVideo = async (classId: string) => {
  console.log(`Toggling video for class ${classId}`);
};

export const StudentDashboard = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  const renderViewContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardOverview />;
      case "timer":
        return <TimerView />;
      case "today":
        return <TodayView />;
      case "schedule":
        return <ScheduleMaker />;
      case "study":
        return <StudyTab />;
      case "groups":
        return <EnhancedGroupsTab />;
      case "classes":
        return <ClassesTab />;
      case "liveclass":
        return <LiveClassPanel 
          classId="sample-class"
          className="Sample Class"
          classSubject="Sample Subject"
          userType="student"
          useLiveStudents={useLiveStudents}
          startClass={startClass}
          endClass={endClass}
          pauseClass={pauseClass}
          resumeClass={resumeClass}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
        />;
      case "analytics":
        return (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Class Analytics</h3>
            <p className="text-muted-foreground mt-2">
              Your teacher will share analytics with you soon
            </p>
          </div>
        );
      case "resources":
        return (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold">Study Resources</h3>
            <p className="text-muted-foreground mt-2">
              Your teacher will share study materials with you soon
            </p>
          </div>
        );
      case "detox":
        return <DigitalDetoxTab />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <MainLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderViewContent()}
    </MainLayout>
  );
};