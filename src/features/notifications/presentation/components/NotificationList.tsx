'use client';

import NotificationItem from './NotificationItem';
import { Notification } from '../../domain/notification.types';

interface Props {
  notifications: Notification[];
  onNotificationClick?: (notificationId: number) => void;
  onDelete?: (notificationId: number) => void;
}

export default function NotificationList({
  notifications,
  onNotificationClick,
  onDelete,
}: Props) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <svg
          className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-neutral-500 dark:text-neutral-400">
          Aucune notification
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.notificationId}
          notification={notification}
          onClick={() => onNotificationClick?.(notification.notificationId)}
          onDelete={() => onDelete?.(notification.notificationId)}
        />
      ))}
    </div>
  );
}