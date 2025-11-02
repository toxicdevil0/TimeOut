import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AuthPage } from "./auth/AuthPage";
import { RoleSelection } from "./auth/RoleSelection";
import { StudentDashboard } from "./dashboard/StudentDashboard";
import { TeacherDashboardPage } from "./dashboard/TeacherDashboardPage";
import { handleAuthSuccess, getUserData } from "@/utils/firebaseUserHandler";
import { updateUserRole } from "@/config/firebase";
import { TokenProvider } from "@/contexts/TokenContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const TimeOutApp = () => {
  const [userRole, setUserRole] = useState<"student" | "teacher" | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [userInitialized, setUserInitialized] = useState(false);

  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Handle user authentication
  useEffect(() => {
    const initializeUser = async () => {
      if (isSignedIn && user?.id && !isInitializing && !userInitialized) {
        setIsInitializing(true);
        try {
          console.log('🔄 Initializing user in database...', user.id);
          await handleAuthSuccess(user);
          
          // Check if user has a role set
          const userData = await getUserData(user.id);
          if (userData?.role) {
            setUserRole(userData.role);
          }
          
          setUserInitialized(true);
        } catch (error) {
          console.error('Failed to initialize user:', error);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    // Reset states when user signs out
    if (!isSignedIn) {
      setUserInitialized(false);
      setUserRole(null);
      setIsInitializing(false);
    }

    initializeUser();
  }, [isSignedIn, user?.id, userInitialized]);

  const handleRoleSelection = async (role: "student" | "teacher") => {
    try {
      if (user) {
        const result = await updateUserRole({ 
          role,
          userId: user.id 
        });
        console.log('✅ Role updated via backend:', result.data);
      }
      setUserRole(role);
    } catch (error) {
      console.error('Failed to update role:', error);
      setUserRole(role);
    }
  };

  // Loading state
  if (!isLoaded || isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center page-transition">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-12 h-12 border border-primary/10 rounded-full mx-auto glow" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              {isInitializing ? "Setting up your account..." : "Loading TimeOut..."}
            </p>
            <p className="text-muted-foreground text-sm">
              Preparing your productivity workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isSignedIn) {
    return <AuthPage />;
  }

  // Show role selection if user hasn't selected a role
  if (!userRole && user) {
    return (
      <RoleSelection
        userName={`${user.firstName} ${user.lastName}`.trim() || user.primaryEmailAddress?.emailAddress || "User"}
        onRoleSelect={handleRoleSelection}
      />
    );
  }

  // Show appropriate dashboard based on role
  if (userRole === "student") {
    return (
      <ThemeProvider>
        <TokenProvider>
          <StudentDashboard />
        </TokenProvider>
      </ThemeProvider>
    );
  }

  if (userRole === "teacher") {
    return (
      <ThemeProvider>
        <TokenProvider>
          <TeacherDashboardPage />
        </TokenProvider>
      </ThemeProvider>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center page-transition">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto glow" />
        <p className="text-muted-foreground">Initializing workspace...</p>
      </div>
    </div>
  );
};