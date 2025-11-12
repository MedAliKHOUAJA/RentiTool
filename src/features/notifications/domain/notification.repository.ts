import {
    Notification,
    NotificationPreferences,
    PushToken,
    CreateNotificationDto,
    NotificationLog,
    NotificationChannel,
    NotificationStatus,
  } from './notification.types';
  
  export interface NotificationRepository {
    // Notifications CRUD
    create(dto: CreateNotificationDto): Promise<Notification>;
    findById(notificationId: number): Promise<Notification | null>;
    findByUserId(
      userId: string,
      options?: { limit?: number; unreadOnly?: boolean; offset?: number }
    ): Promise<Notification[]>;
    markAsRead(notificationId: number): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    countUnread(userId: string): Promise<number>;
    delete(notificationId: number): Promise<void>;
    deleteAllForUser(userId: string): Promise<void>;
  
    // Préférences
    getPreferences(userId: string): Promise<NotificationPreferences | null>;
    createDefaultPreferences(userId: string): Promise<NotificationPreferences>;
    updatePreferences(
      userId: string,
      preferences: Partial<Omit<NotificationPreferences, 'userId' | 'preferenceId' | 'updatedAt'>>
    ): Promise<void>;
  
    // Push Tokens
    savePushToken(
      userId: string,
      token: string,
      deviceType: 'ios' | 'android' | 'web',
      deviceId?: string
    ): Promise<void>;
    getPushTokens(userId: string): Promise<PushToken[]>;
    deactivatePushToken(token: string): Promise<void>;
  
    // Logs
    logNotification(
      notificationId: number,
      channel: NotificationChannel,
      status: NotificationStatus,
      error?: string
    ): Promise<void>;
    getLogs(notificationId: number): Promise<NotificationLog[]>;
  }