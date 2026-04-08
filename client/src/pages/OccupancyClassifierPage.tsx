/**
 * OccupancyClassifierPage
 * 
 * Dedicated page for the occupancy classifier tool.
 * This is a protected page that requires authentication.
 * Users are redirected to login if not authenticated.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import Home from "@/pages/Home";

export default function OccupancyClassifierPage() {
  const { isAuthenticated, loading } = useAuth();

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
    window.location.href = '/';
    return null;
  }

  // Render the Home component which contains the occupancy classifier
  return <Home />;
}
