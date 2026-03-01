/**
 * Notification Center Component
 * 
 * Displays real-time notifications for:
 * - Calculation completions
 * - Rule updates and approvals
 * - Compliance alerts
 * - System messages
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface NotificationCenterProps {
  onNotificationRead?: (id: string) => void;
}

export function NotificationCenter({ onNotificationRead }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-001',
      type: 'success',
      title: 'Calculation Completed',
      message: 'Occupant Load calculation for Riverside Apartments completed successfully',
      timestamp: '2 minutes ago',
      read: false,
      action: { label: 'View Results', href: '/calculation-history' },
    },
    {
      id: 'notif-002',
      type: 'info',
      title: 'Rule Update Approved',
      message: 'Stair Design Requirements update has been approved and is now active',
      timestamp: '15 minutes ago',
      read: false,
      action: { label: 'View Changes', href: '/rule-management' },
    },
    {
      id: 'notif-003',
      type: 'warning',
      title: 'Compliance Alert',
      message: 'Fire exit width calculation shows potential non-compliance. Review recommended.',
      timestamp: '1 hour ago',
      read: true,
      action: { label: 'Review', href: '/calculation-history' },
    },
    {
      id: 'notif-004',
      type: 'info',
      title: 'New Feature Available',
      message: 'Calculation Comparison Tool is now available for design iterations',
      timestamp: '3 hours ago',
      read: true,
    },
  ]);

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    onNotificationRead?.(id);
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-none">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden rounded-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Notification Center</DialogTitle>
              <DialogDescription>
                Real-time alerts for calculations, rule updates, and compliance issues
              </DialogDescription>
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-150px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(80vh-200px)]">
              <div className="space-y-3 pr-4">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all ${
                      getNotificationBgColor(notification.type)
                    } ${!notification.read ? 'border-l-4' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
                          <div className="flex gap-2">
                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 rounded-none"
                                onClick={() => {
                                  markAsRead(notification.id);
                                  // Navigate to action href
                                }}
                              >
                                {notification.action.label}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 rounded-none"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 rounded-none text-destructive hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Summary Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {unreadCount} unread • {notifications.length} total
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none"
              onClick={() => setShowNotifications(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
