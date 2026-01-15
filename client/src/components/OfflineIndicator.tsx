import { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { setupOfflineListener, clearCache } from "@/lib/serviceWorkerRegistration";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Set up online/offline listeners with cleanup
    const cleanup = setupOfflineListener(handleOnline, handleOffline);

    // Listen for service worker updates
    const handleSWUpdated = () => {
      setShowUpdateNotification(true);
    };

    const handleCacheCleared = () => {
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    };

    window.addEventListener('swUpdated', handleSWUpdated);
    window.addEventListener('CACHE_CLEARED', handleCacheCleared);

    return () => {
      cleanup();
      window.removeEventListener('swUpdated', handleSWUpdated);
      window.removeEventListener('CACHE_CLEARED', handleCacheCleared);
    };
  }, []);

  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      // Show "back online" message for 3 seconds
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineMessage]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    clearCache();
  };

  // Show cache cleared message
  if (cacheCleared) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
        <Badge className="px-4 py-2 text-sm font-medium shadow-lg flex items-center gap-2 bg-green-600">
          <RefreshCw className="w-4 h-4" />
          Cache Cleared
        </Badge>
      </div>
    );
  }

  // Show update notification
  if (showUpdateNotification) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className="px-4 py-2 text-sm font-medium shadow-lg flex items-center gap-2 bg-blue-600 cursor-pointer hover:bg-blue-700"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-4 h-4" />
                Update Available - Click to Refresh
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>New version available. Click to update.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="px-4 py-2 text-sm font-medium shadow-lg flex items-center gap-2 cursor-pointer"
              onClick={isOnline ? handleClearCache : undefined}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  Back online
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Offline mode - Using cached data
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? 'Click to clear cache' : 'Cached content available offline'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
