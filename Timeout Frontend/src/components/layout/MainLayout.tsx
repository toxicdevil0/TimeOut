import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { LogoutButton } from "../auth/LogoutButton";
import { TokenDisplay } from "../tokens/TokenDisplay";
import { useTokens } from "@/contexts/TokenContext";

interface MainLayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const MainLayout = ({ children, currentView, onViewChange }: MainLayoutProps) => {
  const { tokens } = useTokens();
  
  const getPageTitle = (view: string) => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      timer: "Focus Timer",
      today: "Today",
      schedule: "Schedule",
      study: "Study",
      groups: "Study Groups",
      classes: "Classes",
      liveclass: "Live Classes",
      analytics: "Class Analytics",
      resources: "Study Resources",
      detox: "Digital Detox",
      settings: "Settings"
    };
    return titles[view] || "Dashboard";
  };

  const getPageDescription = (view: string) => {
    const descriptions: Record<string, string> = {
      dashboard: "Overview of your productivity and progress",
      timer: "Focus sessions and productivity timer",
      today: "Today's tasks and schedule",
      schedule: "Plan and organize your study schedule",
      study: "Study tools and resources",
      groups: "Collaborate with study groups",
      classes: "Manage your classes and assignments",
      liveclass: "Host and manage live class sessions",
      analytics: "Track student engagement and performance",
      resources: "Share study materials and resources",
      detox: "Digital wellness and focus",
      settings: "Customize your TimeOut experience"
    };
    return descriptions[view] || "Welcome to TimeOut";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        activeTab={currentView}
        onTabChange={onViewChange}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {getPageTitle(currentView)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getPageDescription(currentView)}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentView === "timer" && (
              <div className="text-sm text-muted-foreground">
                Ready to focus
              </div>
            )}
            
            {/* Token Balance Display */}
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                <TokenDisplay 
                  amount={tokens.availableTokens} 
                  variant="compact"
                  animated={true}
                />
              </div>
              <LogoutButton variant="header" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};