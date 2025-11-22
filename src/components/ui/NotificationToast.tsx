import { create } from 'zustand';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message?: string;
  duration?: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36);
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
    
    // Auto remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  
  clearAll: () => set({ notifications: [] }),
}));

// Toast component
export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start space-x-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-top ${getStyles(
            notification.type
          )}`}
        >
          {getIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper functions
export const toast = {
  success: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    }),
  
  error: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration,
    }),
  
  warning: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    }),
  
  info: (title: string, message?: string, duration?: number) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    }),
};
