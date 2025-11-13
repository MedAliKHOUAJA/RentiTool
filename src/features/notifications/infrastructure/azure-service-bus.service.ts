import { getSender } from '@/lib/azure/serviceBusClient';
import { ServiceBusNotificationPayload } from '../domain/notification.types';

export class AzureServiceBusService {
  /**
   * Envoyer un message vers le topic Azure Service Bus
   */
  async sendMessage(payload: ServiceBusNotificationPayload): Promise<void> {
    try {
      console.log('📤 [Azure Service Bus] Sending notification:', payload.type);

      const sender = getSender();

      const message = {
        body: payload,
        contentType: 'application/json',
        subject: payload.type,
        applicationProperties: {
          notificationType: payload.type,
          recipientUserId: payload.recipientUserId,
          priority: payload.metadata.priority,
          timestamp: payload.metadata.timestamp,
        },
      };

      await sender.sendMessages(message);
      
      console.log('✅ [Azure Service Bus] Message sent successfully');
    } catch (error: any) {
      console.error('❌ [Azure Service Bus] Error sending message:', error);
      // Ne pas faire échouer la requête principale
      // Logger dans Application Insights ou autre système de monitoring
      throw error;
    }
  }

  /**
   * Envoyer plusieurs messages en batch
   */
  async sendBatch(payloads: ServiceBusNotificationPayload[]): Promise<void> {
    try {
      console.log('📤 [Azure Service Bus] Sending batch of', payloads.length, 'notifications');

      const sender = getSender();

      const messages = payloads.map(payload => ({
        body: payload,
        contentType: 'application/json',
        subject: payload.type,
        applicationProperties: {
          notificationType: payload.type,
          recipientUserId: payload.recipientUserId,
          priority: payload.metadata.priority,
          timestamp: payload.metadata.timestamp,
        },
      }));

      await sender.sendMessages(messages);
      
      console.log('✅ [Azure Service Bus] Batch sent successfully');
    } catch (error: any) {
      console.error('❌ [Azure Service Bus] Error sending batch:', error);
      throw error;
    }
  }
}