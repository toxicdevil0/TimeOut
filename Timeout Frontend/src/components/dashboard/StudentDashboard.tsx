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