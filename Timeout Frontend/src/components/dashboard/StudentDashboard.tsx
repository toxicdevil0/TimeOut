import { useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardTabs } from "./DashboardTabs";
import { ScheduleMaker } from "./tabs/ScheduleMaker";
import { StudyTab } from "./tabs/StudyTab";
import { EnhancedGroupsTab } from "./tabs/EnhancedGroupsTab";
import { ClassesTab } from "./tabs/ClassesTab";
import { DigitalDetoxTab } from "./tabs/DigitalDetoxTab";

export const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("schedule");

  const renderTabContent = () => {
    switch (activeTab) {
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
      default:
        return <ScheduleMaker />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1">
        {renderTabContent()}
      </div>
    </div>
  );
};