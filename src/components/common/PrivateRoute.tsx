import React from "react";
import { Navigate } from "react-router-dom";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAdaptiveContext();

  // Debug logging
  console.log("PrivateRoute: authLoading:", authLoading, "user:", user);

  // Show loading spinner while checking authentication
  if (authLoading) {
    console.log("PrivateRoute: Showing loading spinner");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("PrivateRoute: No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render the protected content if authenticated
  console.log("PrivateRoute: User authenticated, rendering content");
  return <>{children}</>;
};

export default PrivateRoute;
