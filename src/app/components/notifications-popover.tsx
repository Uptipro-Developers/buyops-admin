import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle } from "lucide-react";
import { useEffect } from "react";
import { notificationsApi } from "../../utils/api-service";
import { ScrollArea } from "./ui/scroll-area";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  read: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const [notificationsList, setNotificationsList] = useState<Notification[]>(
    [],
  );

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await notificationsApi.getAll();
        setNotificationsList(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notificationsList.filter((n) => !n.read).length;
  const unreadNotifications = notificationsList.filter((n) => !n.read);

  const markAsRead = (id: string) => {
    notificationsApi
      .markAsRead(id)
      .then(() => {
        setNotificationsList((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      })
      .catch((error) => {
        console.error("Failed to mark notification as read:", error);
      });
  };

  const markAllAsRead = () => {
    notificationsApi
      .markAllAsRead()
      .then(() => {
        setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      })
      .catch((error) => {
        console.error("Failed to mark all as read:", error);
      });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationTime.getTime()) / 60000,
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "WARNING":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-500/10";
      case "WARNING":
        return "bg-yellow-500/10";
      case "ERROR":
        return "bg-red-500/10";
      default:
        return "bg-blue-500/10";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-semibold text-sm">Notifications</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {unreadNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <CheckCircle className="h-7 w-7 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground">
                  You have no new notifications right now.
                </p>
              </div>
            ) : (
              unreadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-muted/30"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-9 h-9 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold leading-snug">
                          {notification.title}
                        </p>
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                          {notification.type.toLowerCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
