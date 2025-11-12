import { ServiceBusClient, ServiceBusReceiver } from '@azure/service-bus';

import { query } from '@/db'; // ✅ Utilise votre fonction query existante
import { EmailNotificationService } from '../application/services/email-notification.service';
import { NotificationChannel, ServiceBusNotificationPayload } from '../domain/notification.types';

export class ServiceBusConsumerService {
  private serviceBusClient: ServiceBusClient;
  private receiver: ServiceBusReceiver | null = null;
  private emailService: EmailNotificationService;
  private isListening: boolean = false;

  constructor() {
    console.log('🔄 [Service Bus Consumer] Initializing...');

    if (!process.env.AZURE_SERVICE_BUS_CONNECTION_STRING) {
      throw new Error('AZURE_SERVICE_BUS_CONNECTION_STRING must be set');
    }

    this.serviceBusClient = new ServiceBusClient(
      process.env.AZURE_SERVICE_BUS_CONNECTION_STRING
    );

    this.emailService = new EmailNotificationService();

    console.log('✅ [Service Bus Consumer] Initialized');
  }

  /**
   * Démarrer l'écoute des messages
   */
  async startListening(queueName: string = 'notifications-queue'): Promise<void> {
    if (this.isListening) {
      console.warn('⚠️ [Service Bus Consumer] Already listening');
      return;
    }

    try {
      console.log(`🎧 [Service Bus Consumer] Starting to listen on queue: ${queueName}`);

      this.receiver = this.serviceBusClient.createReceiver(queueName, {
        receiveMode: 'peekLock', // Message verrouillé pendant le traitement
      });

      this.isListening = true;

      // Écouter les messages en continu
      this.receiver.subscribe({
        processMessage: async (message) => {
          const startTime = Date.now();
          const messageId = message.messageId || 'unknown';

          console.log(`📨 [Service Bus Consumer] Received message ${messageId}`);

          try {
            await this.processMessage(message.body);

            // ✅ Marquer le message comme traité
            await this.receiver!.completeMessage(message);

            const duration = Date.now() - startTime;
            console.log(`✅ [Service Bus Consumer] Message ${messageId} processed in ${duration}ms`);
          } catch (error: any) {
            console.error(`❌ [Service Bus Consumer] Error processing message ${messageId}:`, error);

            // ❌ Abandonner le message (retry automatique par Azure)
            await this.receiver!.abandonMessage(message);
          }
        },
        processError: async (error) => {
          console.error('❌ [Service Bus Consumer] Error in message handler:', error);
        },
      });

      console.log('✅ [Service Bus Consumer] Listening started');
    } catch (error: any) {
      this.isListening = false;
      console.error('❌ [Service Bus Consumer] Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Traiter un message de notification
   */
  private async processMessage(payload: ServiceBusNotificationPayload): Promise<void> {
    try {
      console.log('📨 [Service Bus Consumer] Processing notification:', {
        type: payload.type,
        recipient: payload.recipientUserId,
        title: payload.title,
        channels: payload.metadata?.channels || [],
      });

      // 1️⃣ Récupérer l'utilisateur depuis PostgreSQL
      const userResult = await query(
        `SELECT "UserId" as "userId", "Email" as "email", "FirstName" as "firstName", "LastName" as "lastName"
         FROM "Users"
         WHERE "UserId" = $1`,
        [payload.recipientUserId]
      );

      if (userResult.rows.length === 0) {
        console.warn('⚠️ [Service Bus Consumer] User not found:', payload.recipientUserId);
        return;
      }

      const user = userResult.rows[0];

      if (!user.email) {
        console.warn('⚠️ [Service Bus Consumer] User has no email:', user.userId);
        return;
      }

      // 2️⃣ Récupérer les préférences de notification
      const preferencesResult = await query(
        `SELECT "EnableEmail" as "enableEmail", "EnableInApp" as "enableInApp", "EnablePush" as "enablePush"
         FROM "NotificationPreferences"
         WHERE "UserId" = $1`,
        [payload.recipientUserId]
      );

      // Si pas de préférences, créer les préférences par défaut
      let preferences = preferencesResult.rows[0];
      if (!preferences) {
        console.log('📝 [Service Bus Consumer] Creating default preferences for user:', user.userId);
        const defaultPrefsResult = await query(
          `INSERT INTO "NotificationPreferences" ("UserId")
           VALUES ($1)
           RETURNING "EnableEmail" as "enableEmail", "EnableInApp" as "enableInApp", "EnablePush" as "enablePush"`,
          [payload.recipientUserId]
        );
        preferences = defaultPrefsResult.rows[0];
      }

      // 3️⃣ Dispatcher vers les canaux appropriés
      const channels = payload.metadata?.channels || [NotificationChannel.EMAIL];

      // 📧 Envoi par email (si activé dans les préférences)
      if (channels.includes(NotificationChannel.EMAIL) && preferences.enableEmail) {
        console.log(`📧 [Service Bus Consumer] Sending email to: ${user.email}`);
        
        try {
          await this.emailService.send(user.email, payload);
          console.log('✅ [Service Bus Consumer] Email sent successfully');

          // Mettre à jour le statut de la notification (optionnel)
          if (payload.data?.notificationId) {
            await this.updateNotificationEmailStatus(payload.data.notificationId, 'sent');
          }
        } catch (emailError: any) {
          console.error('❌ [Service Bus Consumer] Email sending failed:', emailError);

          // Mettre à jour le statut en erreur
          if (payload.data?.notificationId) {
            await this.updateNotificationEmailStatus(payload.data.notificationId, 'failed');
          }

          throw emailError; // Re-throw pour retry
        }
      } else if (channels.includes(NotificationChannel.EMAIL) && !preferences.enableEmail) {
        console.log('⏭️ [Service Bus Consumer] Email notifications disabled for this user');
      }

      // 🔔 Notification in-app (WebSocket) - TODO
      if (channels.includes(NotificationChannel.IN_APP) && preferences.enableInApp) {
        console.log('🔔 [Service Bus Consumer] In-app notification (WebSocket not implemented yet)');
        // TODO: Implémenter WebSocket pour les notifications temps réel
      }

      // 📱 Push notification (Mobile) - TODO
      if (channels.includes(NotificationChannel.PUSH) && preferences.enablePush) {
        console.log('📱 [Service Bus Consumer] Push notification (not implemented yet)');
        // TODO: Implémenter push notifications
      }

      console.log('✅ [Service Bus Consumer] Notification processed successfully');
    } catch (error: any) {
      console.error('❌ [Service Bus Consumer] Error processing notification:', error);
      throw error; // Le message sera retry par Azure Service Bus
    }
  }

  /**
   * Mettre à jour le statut d'envoi email d'une notification
   */
  private async updateNotificationEmailStatus(
    notificationId: number,
    status: 'sent' | 'failed'
  ): Promise<void> {
    try {
      // Vous pouvez ajouter un champ "EmailStatus" et "EmailSentAt" dans votre table Notifications
      await query(
        `UPDATE "Notifications" 
         SET "UpdatedAt" = CURRENT_TIMESTAMP
         WHERE "NotificationId" = $1`,
        [notificationId]
      );
      
      console.log(`✅ [Service Bus Consumer] Notification ${notificationId} email status: ${status}`);
    } catch (error) {
      console.error('❌ [Service Bus Consumer] Failed to update notification email status:', error);
      // Ne pas throw, c'est une opération secondaire
    }
  }

  /**
   * Arrêter l'écoute
   */
  async stopListening(): Promise<void> {
    try {
      console.log('🛑 [Service Bus Consumer] Stopping...');

      if (this.receiver) {
        await this.receiver.close();
        this.receiver = null;
      }

      await this.serviceBusClient.close();
      this.isListening = false;

      console.log('✅ [Service Bus Consumer] Stopped successfully');
    } catch (error) {
      console.error('❌ [Service Bus Consumer] Error stopping:', error);
      throw error;
    }
  }

  /**
   * Vérifier si le consumer est actif
   */
  isActive(): boolean {
    return this.isListening;
  }
}