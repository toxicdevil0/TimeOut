import { useState } from "react";
import { 
  Calendar, 
  Timer, 
  Users, 
  GraduationCap, 
  Shield, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoutButton } from "../auth/LogoutButton";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string | number;
}

const navigationItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard", 
    icon: BarChart3,
    description: "Overview & stats"
  },
  {
    id: "timer",
    label: "Focus Timer",
    icon: Timer,
    description: "Pomodoro sessions"
  },
  {
    id: "today", 
    label: "Today",
    icon: CheckSquare,
    description: "Today's tasks",
    badge: 3
  },
  {
    id: "schedule",
    label: "This Week", 
    icon: Calendar,
    description: "Weekly schedule"
  },
  {
    id: "groups",
    label: "Study Groups",
    icon: Users,
    description: "Collaborative sessions", 
    badge: 2
  },
  {
    id: "classes",
    label: "Classes",
    icon: GraduationCap,
    description: "Course management"
  },
  {
    id: "detox",
    label: "Digital Detox",
    icon: Shield,
    description: "Focus & productivity"
  }
];

const bottomItems: NavItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "App preferences"
  }
];

export const Sidebar = ({ activeTab, onTabChange, className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const NavItemComponent = ({ item, isActive }: { item: NavItem; isActive: boolean }) => (
    <Button
      variant="ghost"
      size={isCollapsed ? "sm" : "default"}
      className={cn(
        "w-full justify-start h-10 px-3 mb-1 text-left font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        isCollapsed ? "px-2" : "px-3"
      )}
      onClick={() => onTabChange(item.id)}
    >
      <item.icon className={cn("h-4 w-4 flex-shrink-0", isCollapsed ? "" : "mr-3")} />
      {!isCollapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="truncate">{item.label}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground truncate">
                {item.description}
              </div>
            )}
          </div>
          {item.badge && (
            <div className="ml-auto flex-shrink-0">
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary/20 text-primary rounded-full">
                {item.badge}
              </span>
            </div>
          )}
        </>
      )}
    </Button>
  );

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">TimeOut</h1>
                <p className="text-xs text-muted-foreground">Focus & Study</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 hover:bg-accent/50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1">
        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="mb-6 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Today's Focus</span>
            </div>
            <div className="text-lg font-bold text-foreground">2h 45m</div>
            <div className="text-xs text-muted-foreground">Goal: 4h</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full w-2/3 transition-all"></div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <NavItemComponent 
              key={item.id} 
              item={item} 
              isActive={activeTab === item.id} 
            />
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => (
          <NavItemComponent 
            key={item.id} 
            item={item} 
            isActive={activeTab === item.id} 
          />
        ))}
        
        {/* Logout Button */}
        {!isCollapsed && (
          <LogoutButton variant="sidebar" />
        )}
      </div>
    </div>
  );
};