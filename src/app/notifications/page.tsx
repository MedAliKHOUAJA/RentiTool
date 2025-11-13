'use client';

import React, { useState } from 'react';
import NotificationList from '@/features/notifications/presentation/components/NotificationList';
import BgGlassmorphism from '@/components/BgGlassmorphism';
import BackgroundSection from '@/components/BackgroundSection';
import { useNotifications } from '@/features/notifications/presentation/hooks/useNotification';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    limit: 50,
    unreadOnly: filter === 'unread',
  });

  // ✅ Marquer une notification comme lue
  const handleNotificationClick = async (notificationId: number) => {
    try {
      console.log('🔔 Marking notification as read:', notificationId);
      await markAsRead(notificationId);
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking as read:', error);
    }
  };

  // ✅ Supprimer une notification
  const handleDelete = async (notificationId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette notification ?')) {
      return;
    }

    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // ✅ Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Erreur lors du marquage');
    }
  };

  return (
    <div className="container px-4 sm:px-6 lg:px-8 my-6 sm:my-10 relative">
      <BgGlassmorphism className="absolute inset-x-0 md:top-10 xl:top-40 min-h-0 pl-20 py-24 flex overflow-hidden z-0 pointer-events-none" />
      
      <div className="relative py-4 sm:py-8">
        <BackgroundSection className="bg-neutral-100 dark:bg-black dark:bg-opacity-20 pointer-events-none" />
        
        {/* Header - Mobile First */}
        <div className="relative z-10 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
            Notifications
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-2">
            {unreadCount > 0 
              ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont lues'
            }
          </p>
        </div>

        {/* Filters - Mobile First */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Non lues {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-center sm:text-left"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Content - Mobile First */}
        <div className="relative z-10 bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12 sm:p-20">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm sm:text-base text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Réessayer
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-center">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-neutral-300 dark:text-neutral-600 mb-4"
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
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
                {filter === 'unread' 
                  ? 'Aucune notification non lue' 
                  : 'Aucune notification'
                }
              </p>
            </div>
          ) : (
            <NotificationList
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}