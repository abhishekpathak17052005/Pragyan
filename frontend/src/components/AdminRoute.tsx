import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

/**
 * AdminRoute Component
 * Requires user to have ADMIN role
 * Redirects to /auth if not authenticated or wrong role
 */
export function AdminRoute({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  const { loading, isAuthenticated, userRole } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && (!isAuthenticated || userRole !== "ADMIN")) {
      navigate("/auth");
    }
  }, [isAuthenticated, loading, userRole, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            This page is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
