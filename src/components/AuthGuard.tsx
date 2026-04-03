import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Preserve the page they were trying to visit so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
