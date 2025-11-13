import { Notification } from '../../domain/notification.types';
import { PostgresNotificationRepository } from '../../infrastructure/postgres-notification.repository';

interface GetUserNotificationsParams {
  userId: string;
  limit?: number;
  unreadOnly?: boolean;
  offset?: number;
}

export class GetUserNotificationsUseCase {
  async execute(params: GetUserNotificationsParams): Promise<{
    success: boolean;
    notifications?: Notification[];
    unreadCount?: number;
    error?: string;
  }> {
    try {
      console.log('📥 [GetUserNotificationsUseCase] Fetching for user:', params.userId);

      const repository = new PostgresNotificationRepository();

      const [notifications, unreadCount] = await Promise.all([
        repository.findByUserId(params.userId, {
          limit: params.limit,
          unreadOnly: params.unreadOnly,
          offset: params.offset,
        }),
        repository.countUnread(params.userId),
      ]);

      console.log('✅ [GetUserNotificationsUseCase] Found', notifications.length, 'notifications');

      return {
        success: true,
        notifications,
        unreadCount,
      };
    } catch (error: any) {
      console.error('❌ [GetUserNotificationsUseCase] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications',
      };
    }
  }
}