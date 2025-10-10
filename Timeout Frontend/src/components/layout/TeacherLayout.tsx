import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

interface TeacherLayoutProps {
  children: ReactNode;
}

export const TeacherLayout = ({ children }: TeacherLayoutProps) => {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your classes and students</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="glass text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};