import { PostgresNotificationRepository } from '../../infrastructure/postgres-notification.repository';

export class MarkAsReadUseCase {
  async execute(
    notificationId: number,
    userId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('✓ [MarkAsReadUseCase] Marking notification as read:', notificationId);

      const repository = new PostgresNotificationRepository();

      // Vérifier que la notification appartient à l'utilisateur
      const notification = await repository.findById(notificationId);

      if (!notification) {
        return {
          success: false,
          error: 'Notification not found',
        };
      }

      if (notification.userId !== userId) {
        return {
          success: false,
          error: 'Unauthorized',
        };
      }

      await repository.markAsRead(notificationId);

      console.log('✅ [MarkAsReadUseCase] Notification marked as read');

      return { success: true };
    } catch (error: any) {
      console.error('❌ [MarkAsReadUseCase] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark as read',
      };
    }
  }

  async executeAll(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('✓ [MarkAsReadUseCase] Marking all notifications as read for user:', userId);

      const repository = new PostgresNotificationRepository();
      await repository.markAllAsRead(userId);

      console.log('✅ [MarkAsReadUseCase] All notifications marked as read');

      return { success: true };
    } catch (error: any) {
      console.error('❌ [MarkAsReadUseCase] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark all as read',
      };
    }
  }
}