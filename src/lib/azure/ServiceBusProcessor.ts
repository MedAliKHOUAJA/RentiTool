import { ServiceBusClient, ServiceBusReceiver, ProcessErrorArgs } from '@azure/service-bus';
import { ServiceBusNotificationPayload } from '@/features/notifications/domain/notification.types';
import { NotificationService } from '@/features/notifications/application/services/notification.service';
import { PostgresNotificationRepository } from '@/features/notifications/infrastructure/postgres-notification.repository';
import { AzureServiceBusService } from '@/features/notifications/infrastructure/azure-service-bus.service';

const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING!;
const topicName = 'notifications';
const subscriptionName = process.env.AZURE_SERVICE_BUS_SUBSCRIPTION_NAME || 'all-notifications';

let receiver: ServiceBusReceiver | null = null;
let client: ServiceBusClient | null = null;

/**
 * Démarrer l'écoute des messages Azure Service Bus
 */
export async function startServiceBusProcessor() {
  try {
    console.log('🎧 [Service Bus Processor] Starting...');

    // Créer le client
    client = new ServiceBusClient(connectionString);

    // Créer le receiver pour la subscription
    receiver = client.createReceiver(topicName, subscriptionName, {
      receiveMode: 'peekLock', // ou 'receiveAndDelete'
    });

    // Initialiser les services
    const repository = new PostgresNotificationRepository();
    const serviceBusService = new AzureServiceBusService();
    const notificationService = new NotificationService(repository, serviceBusService);

    // Handler pour les messages reçus
    const messageHandler = async (messageReceived: any) => {
      try {
        console.log('📨 [Service Bus Processor] Message received:', {
          subject: messageReceived.subject,
          messageId: messageReceived.messageId,
        });

        const payload: ServiceBusNotificationPayload = messageReceived.body;

        // Traiter la notification selon les canaux demandés
        await notificationService.processNotification(payload);

        // Compléter le message (le retirer de la queue)
        await receiver!.completeMessage(messageReceived);
        
        console.log('✅ [Service Bus Processor] Message processed successfully');
      } catch (error: any) {
        console.error('❌ [Service Bus Processor] Error processing message:', error);
        
        // Abandonner le message (il sera réessayé)
        await receiver!.abandonMessage(messageReceived);
      }
    };

    // Handler pour les erreurs
    const errorHandler = async (args: ProcessErrorArgs) => {
      console.error('❌ [Service Bus Processor] Error:', {
        error: args.error,
        errorSource: args.errorSource,
        entityPath: args.entityPath,
        fullyQualifiedNamespace: args.fullyQualifiedNamespace,
      });
    };

    // Démarrer l'écoute
    receiver.subscribe({
      processMessage: messageHandler,
      processError: errorHandler,
    });

    console.log('✅ [Service Bus Processor] Listening for messages...');
  } catch (error) {
    console.error('❌ [Service Bus Processor] Failed to start:', error);
    throw error;
  }
}

/**
 * Arrêter le processor
 */
export async function stopServiceBusProcessor() {
  try {
    console.log('🛑 [Service Bus Processor] Stopping...');

    if (receiver) {
      await receiver.close();
      receiver = null;
    }

    if (client) {
      await client.close();
      client = null;
    }

    console.log('✅ [Service Bus Processor] Stopped');
  } catch (error) {
    console.error('❌ [Service Bus Processor] Error stopping:', error);
  }
}

// Gérer l'arrêt gracieux
process.on('SIGINT', async () => {
  await stopServiceBusProcessor();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopServiceBusProcessor();
  process.exit(0);
});