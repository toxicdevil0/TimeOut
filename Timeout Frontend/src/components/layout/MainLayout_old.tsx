import { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const MainLayout = ({ children, currentView, onViewChange }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "timer":
        return <TimerView />;
      case "today":
        return <TodayView />;
      case "schedule":
        return <ScheduleMaker />;
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
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        className="flex-shrink-0"
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Header - TickTick style */}
        <div className="bg-card border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground capitalize">
                {activeTab === "detox" ? "Digital Detox" : activeTab}
              </h1>
              <p className="text-sm text-muted-foreground">
                {getPageDescription(activeTab)}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {activeTab === "timer" && (
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">Next Session</div>
                  <div className="text-xs text-muted-foreground">Focus - 25 min</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const getPageDescription = (tab: string): string => {
  const descriptions: Record<string, string> = {
    dashboard: "Overview of your study progress and activities",
    timer: "Focus sessions with Pomodoro technique",
    today: "Tasks and sessions scheduled for today",
    schedule: "Weekly schedule and upcoming sessions",
    groups: "Collaborative study sessions with peers",
    classes: "Course management and class schedules",
    detox: "Digital wellness and focus analytics",
    settings: "Application preferences and configuration"
  };
  
  return descriptions[tab] || "Manage your study activities";
};