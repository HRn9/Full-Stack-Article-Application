import React, { useEffect } from 'react';
import type { Notification } from '../types';

interface NotificationToastProps {
  notifications: Notification[];
  onRemove: (timestamp: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onRemove,
}) => {
  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        const oldest = notifications[notifications.length - 1];
        if (oldest) {
          onRemove(oldest.timestamp);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notifications, onRemove]);

  const getNotificationIcon = (type: Notification['type']): string => {
    switch (type) {
      case 'article_created':
        return '✨';
      case 'article_updated':
        return '📝';
      case 'article_deleted':
        return '🗑️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationClass = (type: Notification['type']): string => {
    switch (type) {
      case 'article_created':
        return 'notification-success';
      case 'article_updated':
        return 'notification-info';
      case 'article_deleted':
        return 'notification-warning';
      default:
        return 'notification-info';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.slice(0, 3).map((notification) => (
        <div
          key={notification.timestamp}
          className={`notification-toast ${getNotificationClass(notification.type)}`}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <div className="notification-message">{notification.message}</div>
          </div>
          <button
            className="notification-close"
            onClick={() => onRemove(notification.timestamp)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
