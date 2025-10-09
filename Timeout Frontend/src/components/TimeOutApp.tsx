import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { AuthPage } from "./auth/AuthPage";
import { RoleSelection } from "./auth/RoleSelection";
import { StudentDashboard } from "./dashboard/StudentDashboard";
import { handleAuthSuccess, getUserData } from "@/utils/firebaseUserHandler";
import { updateUserRole } from "@/config/firebase";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">
            {isInitializing ? "Setting up your account..." : "Loading..."}
          </p>
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
    return <StudentDashboard />;
  }

  if (userRole === "teacher") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};