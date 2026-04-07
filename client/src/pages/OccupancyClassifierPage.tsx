/**
 * OccupancyClassifierPage
 * 
 * Dedicated page for the occupancy classifier tool.
 * This is a protected page that requires authentication.
 * Users are redirected to login if not authenticated.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useSessionExchange } from "@/_core/hooks/useSessionExchange";
import Home from "@/pages/Home";

export default function OccupancyClassifierPage() {
  // Ensure session exchange happens
  useSessionExchange();
  
  // Require authentication for this page
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useAuth hook
  }

  // Render the Home component which contains the occupancy classifier
  // The Home component will show the classifier content since user is authenticated
  return <Home />;
}
