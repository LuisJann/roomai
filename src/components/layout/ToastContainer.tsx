"use client";

import { useWorkspaceStore } from "@/store/workspaceStore";
import { CheckCircle2, XCircle, Info, Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ToastContainer() {
  const notifications = useWorkspaceStore(state => state.notifications);
  const removeNotification = useWorkspaceStore(state => state.removeNotification);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.type !== "info") { // Keep loading info until manually removed
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-2xl shadow-xl border animate-in slide-in-from-right-8 fade-in duration-300",
            notification.type === "success" && "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
            notification.type === "error" && "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
            notification.type === "info" && "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
          )}
        >
          {notification.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />}
          {notification.type === "error" && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
          {notification.type === "info" && <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 animate-spin" />}
          
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
            {notification.link && (
              <a href={notification.link} className="text-xs font-bold underline mt-1 inline-block hover:opacity-80">
                Vai alla Galleria &rarr;
              </a>
            )}
          </div>

          {notification.type !== "info" && (
            <button 
              onClick={() => removeNotification(notification.id)}
              className="text-foreground/40 hover:text-foreground/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
