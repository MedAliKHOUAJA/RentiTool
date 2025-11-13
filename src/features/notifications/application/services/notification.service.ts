import {
    NotificationType,
    NotificationChannel,
    NotificationPriority,
    ServiceBusNotificationPayload,
    CreateNotificationDto,
    NotificationStatus,
  } from '../../domain/notification.types';
  import { NotificationRepository } from '../../domain/notification.repository';
  import { AzureServiceBusService } from '../../infrastructure/azure-service-bus.service';
  import { EmailNotificationService } from './email-notification.service';
  import { PushNotificationService } from './push-notification.service';
  import { query } from '@/db';
  
  export class NotificationService {
    private emailService: EmailNotificationService;
    private pushService: PushNotificationService;
  
    constructor(
      private repository: NotificationRepository,
      private serviceBusService: AzureServiceBusService
    ) {
      this.emailService = new EmailNotificationService();
      this.pushService = new PushNotificationService(repository);
    }
  
    /**
     * Créer et envoyer une notification
     */
    async sendNotification(dto: CreateNotificationDto): Promise<void> {
      try {
        console.log('📤 [NotificationService] Sending notification:', dto.type);
  
        // 1. Récupérer les préférences de l'utilisateur
        let prefs = await this.repository.getPreferences(dto.userId);
        
        if (!prefs) {
          // Créer les préférences par défaut si elles n'existent pas
          prefs = await this.repository.createDefaultPreferences(dto.userId);
        }
  
        // 2. Vérifier si l'utilisateur veut recevoir ce type de notification
        if (!this.shouldNotify(dto.type, prefs)) {
          console.log('⚠️ [NotificationService] User preferences disabled for:', dto.type);
          return;
        }
  
        // 3. Créer la notification in-app (toujours)
        const notification = await this.repository.create(dto);
  
        // 4. Déterminer les canaux à utiliser
        const channels: NotificationChannel[] = [];
        if (prefs.enableInApp) channels.push(NotificationChannel.IN_APP);
        if (prefs.enableEmail) channels.push(NotificationChannel.EMAIL);
        if (prefs.enablePush) channels.push(NotificationChannel.PUSH);
  
        // 5. Récupérer l'email de l'utilisateur
        const userResult = await query(
          `SELECT "Email" FROM "User" WHERE "userId" = $1`,
          [dto.userId]
        );
        const userEmail = userResult.rows[0]?.Email;
  
        // 6. Créer le payload pour Service Bus
        const payload: ServiceBusNotificationPayload = {
          type: dto.type,
          recipientUserId: dto.userId,
          title: dto.title,
          message: dto.message,
          data: {
            notificationId: notification.notificationId,
            ...dto.data,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            priority: dto.priority || NotificationPriority.MEDIUM,
            channels,
          },
        };
  
        // 7. Envoyer via Azure Service Bus (pour traitement async)
        await this.serviceBusService.sendMessage(payload);
  
        // 8. Log in-app
        await this.repository.logNotification(
          notification.notificationId,
          NotificationChannel.IN_APP,
          NotificationStatus.SENT
        );
  
        console.log('✅ [NotificationService] Notification sent successfully');
      } catch (error: any) {
        console.error('❌ [NotificationService] Error sending notification:', error);
        throw error;
      }
    }
  
    /**
     * Traiter une notification reçue depuis Service Bus
     */
    async processNotification(payload: ServiceBusNotificationPayload): Promise<void> {
      try {
        console.log('⚙️ [NotificationService] Processing notification:', payload.type);
  
        const notificationId = payload.data.notificationId;
        const channels = payload.metadata.channels;
  
        // Récupérer l'email de l'utilisateur
        const userResult = await query(
          `SELECT "Email" FROM "User" WHERE "userId" = $1`,
          [payload.recipientUserId]
        );
        const userEmail = userResult.rows[0]?.Email;
  
        // Envoyer via les canaux demandés
        const promises = [];
  
        // Email
        if (channels.includes(NotificationChannel.EMAIL) && userEmail) {
          promises.push(
            this.emailService.send(userEmail, payload)
              .then(() => {
                return this.repository.logNotification(
                  notificationId,
                  NotificationChannel.EMAIL,
                  NotificationStatus.SENT
                );
              })
              .catch((error) => {
                return this.repository.logNotification(
                  notificationId,
                  NotificationChannel.EMAIL,
                  NotificationStatus.FAILED,
                  error.message
                );
              })
          );
        }
  
        // Push
        if (channels.includes(NotificationChannel.PUSH)) {
          promises.push(
            this.pushService.send(payload.recipientUserId, payload)
              .then(() => {
                return this.repository.logNotification(
                  notificationId,
                  NotificationChannel.PUSH,
                  NotificationStatus.SENT
                );
              })
              .catch((error) => {
                return this.repository.logNotification(
                  notificationId,
                  NotificationChannel.PUSH,
                  NotificationStatus.FAILED,
                  error.message
                );
              })
          );
        }
  
        await Promise.allSettled(promises);
  
        console.log('✅ [NotificationService] Notification processed successfully');
      } catch (error: any) {
        console.error('❌ [NotificationService] Error processing notification:', error);
        throw error;
      }
    }
  
    /**
     * Vérifier si l'utilisateur veut recevoir ce type de notification
     */
    private shouldNotify(
      type: NotificationType,
      prefs: any
    ): boolean {
      const mapping: Record<NotificationType, keyof typeof prefs> = {
        [NotificationType.REVIEW_REPLY]: 'notifyOnReviewReply',
        [NotificationType.NEW_REVIEW]: 'notifyOnNewReview',
        [NotificationType.BOOKING_CONFIRMED]: 'notifyOnBookingConfirmed',
        [NotificationType.BOOKING_CANCELLED]: 'notifyOnBookingCancelled',
        [NotificationType.MESSAGE_RECEIVED]: 'notifyOnMessageReceived',
        [NotificationType.BOOKING_REQUESTED]: 'notifyOnBookingConfirmed',
        [NotificationType.BOOKING_ACCEPTED]: 'notifyOnBookingConfirmed',
        [NotificationType.BOOKING_REJECTED]: 'notifyOnBookingCancelled',
        [NotificationType.TOOL_APPROVED]: 'notifyOnNewReview',
        [NotificationType.TOOL_REJECTED]: 'notifyOnNewReview',
        [NotificationType.PAYMENT_RECEIVED]: 'notifyOnBookingConfirmed',
        [NotificationType.PAYMENT_FAILED]: 'notifyOnBookingCancelled',
      };
  
      const prefKey = mapping[type];
      return prefKey ? prefs[prefKey] : true;
    }
  }