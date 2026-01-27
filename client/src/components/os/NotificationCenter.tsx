import { useState } from "react";
import { useOS, type NotificationItem } from "@/lib/os-context";
import { Bell, X, Check, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationIcon({ type }: { type: NotificationItem["type"] }) {
  switch (type) {
    case "success":
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

export function NotificationCenter() {
  const { notifications, markNotificationRead, dismissNotification, clearNotifications } = useOS();
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        data-testid="notification-center-toggle"
      >
        <Bell className="w-4 h-4 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 bottom-full mb-2 w-80 max-h-96 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title="Mark all as read"
                    data-testid="mark-all-read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    title="Clear all"
                    data-testid="clear-all-notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/40">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      !notification.read ? "bg-white/5" : ""
                    }`}
                    onClick={() => markNotificationRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <NotificationIcon type={notification.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium truncate ${
                            notification.read ? "text-white/70" : "text-white"
                          }`}>
                            {notification.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white shrink-0"
                            data-testid={`dismiss-notification-${notification.id}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className={`text-xs mt-0.5 ${
                          notification.read ? "text-white/40" : "text-white/60"
                        }`}>
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-white/30 mt-1 block">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
