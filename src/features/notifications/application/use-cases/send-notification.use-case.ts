import { CreateNotificationDto } from '../../domain/notification.types';
import { NotificationService } from '../services/notification.service';
import { PostgresNotificationRepository } from '../../infrastructure/postgres-notification.repository';
import { AzureServiceBusService } from '../../infrastructure/azure-service-bus.service';

export class SendNotificationUseCase {
  async execute(dto: CreateNotificationDto): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('📤 [SendNotificationUseCase] Executing for type:', dto.type);

      const repository = new PostgresNotificationRepository();
      const serviceBusService = new AzureServiceBusService();
      const notificationService = new NotificationService(repository, serviceBusService);

      await notificationService.sendNotification(dto);

      console.log('✅ [SendNotificationUseCase] Notification sent successfully');

      return { success: true };
    } catch (error: any) {
      console.error('❌ [SendNotificationUseCase] Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send notification',
      };
    }
  }
}