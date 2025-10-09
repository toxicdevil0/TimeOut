import { useState } from "react";
import { Calendar, Clock, Users, BookOpen, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "study", label: "Study", icon: Clock },
  { id: "groups", label: "Groups", icon: Users },
  { id: "classes", label: "Classes", icon: BookOpen },
  { id: "detox", label: "Digital Detox", icon: Shield },
];

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const DashboardTabs = ({ activeTab, onTabChange }: DashboardTabsProps) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback to reload if signOut fails
      window.location.reload();
    }
  };

  return (
    <div className="glass border-b border-glass-border">
      <div className="flex items-center justify-between">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-smooth border-b-2 whitespace-nowrap",
                  isActive
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Sign Out Button */}
        <div className="px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="glass text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};