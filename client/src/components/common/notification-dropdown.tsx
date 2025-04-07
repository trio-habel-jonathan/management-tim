import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, MessageSquare, FileUp, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

// These would come from the API in a real application
const mockNotifications = [
  {
    id: 1,
    type: "comment",
    message: "Alex commented on \"Design homepage wireframes\"",
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: 2,
    type: "file",
    message: "Michael shared \"Q4 Marketing Plan.pdf\"",
    time: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
  },
  {
    id: 3,
    type: "meeting",
    message: "Weekly sync in 30 minutes",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
];

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const getIconForNotificationType = (type: string) => {
    switch (type) {
      case "comment":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
        );
      case "file":
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <FileUp className="h-5 w-5 text-secondary" />
          </div>
        );
      case "meeting":
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <Users className="h-5 w-5 text-accent" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Bell className="h-5 w-5 text-gray-500" />
          </div>
        );
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-3 border-b border-gray-200 dark:border-dark-darker flex items-center justify-between">
          <DropdownMenuLabel className="font-semibold p-0 text-base">
            Notifications
          </DropdownMenuLabel>
          <Button
            variant="link"
            className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
        
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 focus:bg-gray-50 dark:focus:bg-dark border-b border-gray-200 dark:border-dark-darker cursor-pointer ${
                  notification.read ? "opacity-70" : "opacity-100"
                }`}
              >
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    {getIconForNotificationType(notification.type)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                      {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} {notification.read ? "" : "(new)"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(notification.time)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        
        <div className="p-0 border-t border-gray-200 dark:border-dark-darker">
          <Button
            variant="link"
            className="w-full p-3 h-auto justify-center text-primary text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark"
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
