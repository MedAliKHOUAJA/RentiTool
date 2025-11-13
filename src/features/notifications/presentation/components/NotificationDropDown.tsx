'use client';

import { useNotifications } from '../hooks/useNotification';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications({
    limit: 5,
  });

  const handleNotificationClick = async (notificationId: number) => {
    await markAsRead(notificationId);
    onClose();
  };

  return (
    <>
      {/* Backdrop pour fermer au clic */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-screen max-w-md sm:max-w-lg z-50">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await markAllAsRead();
                }}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <svg
                  className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mb-3"
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
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.notificationId}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification.notificationId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
            <Link
              href="/notifications"
              onClick={onClose}
              className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 py-2"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}