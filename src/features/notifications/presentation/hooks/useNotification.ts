'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../../domain/notification.types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

export function useNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    limit = 20,
    unreadOnly = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 secondes
  } = options || {};

  /**
   * Récupérer les notifications
   */
  const fetchNotifications = useCallback(async () => {
    try {
      console.log('📥 [useNotifications] Fetching notifications...');

      const params = new URLSearchParams({
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      console.log('✅ [useNotifications] Fetched', data.notifications.length, 'notifications');

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err: any) {
      console.error('❌ [useNotifications] Error:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [limit, unreadOnly]);

  /**
   * Marquer comme lue
   */
  const markAsRead = async (notificationId: number) => {
    try {
      console.log('✓ [useNotifications] Marking as read:', notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include', // 🔑 Envoie les cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(notif =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      console.log('✅ [useNotifications] Marked as read');
    } catch (err: any) {
      console.error('❌ [useNotifications] Error marking as read:', err);
      throw err;
    }
  };

  /**
   * Marquer toutes comme lues
   */
  const markAllAsRead = async () => {
    try {
      console.log('✓ [useNotifications] Marking all as read');

      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Mettre à jour localement
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );

      setUnreadCount(0);

      console.log('✅ [useNotifications] All marked as read');
    } catch (err: any) {
      console.error('❌ [useNotifications] Error marking all as read:', err);
      throw err;
    }
  };

  /**
   * Supprimer une notification
   */
  const deleteNotification = async (notificationId: number) => {
    try {
      console.log('🗑️ [useNotifications] Deleting notification:', notificationId);

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Mettre à jour localement
      const notifToDelete = notifications.find(n => n.notificationId === notificationId);

      setNotifications(prev =>
        prev.filter(notif => notif.notificationId !== notificationId)
      );

      if (notifToDelete && !notifToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      console.log('✅ [useNotifications] Notification deleted');
    } catch (err: any) {
      console.error('❌ [useNotifications] Error deleting notification:', err);
      throw err;
    }
  };

  /**
   * Charger au montage
   */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Auto-refresh
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}