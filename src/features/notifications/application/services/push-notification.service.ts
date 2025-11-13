import { ServiceBusNotificationPayload } from '../../domain/notification.types';
import { NotificationRepository } from '../../domain/notification.repository';

// Si vous utilisez Firebase Cloud Messaging (FCM)
// import admin from 'firebase-admin';

export class PushNotificationService {
  constructor(private repository: NotificationRepository) {
    // Initialiser Firebase Admin SDK si nécessaire
    // if (!admin.apps.length) {
    //   admin.initializeApp({
    //     credential: admin.credential.cert({
    //       projectId: process.env.FIREBASE_PROJECT_ID,
    //       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    //       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    //     }),
    //   });
    // }
  }

  /**
   * Envoyer une push notification
   */
  async send(
    userId: string,
    payload: ServiceBusNotificationPayload
  ): Promise<void> {
    try {
      console.log('📱 [Push Service] Sending push notification to user:', userId);

      // Récupérer les tokens push de l'utilisateur
      const tokens = await this.repository.getPushTokens(userId);

      if (tokens.length === 0) {
        console.log('⚠️ [Push Service] No push tokens found for user');
        return;
      }

      console.log('📱 [Push Service] Found', tokens.length, 'active tokens');

      // Envoyer via Firebase Cloud Messaging (exemple)
      const promises = tokens.map(async (tokenData) => {
        try {
          // Exemple avec FCM
          // await admin.messaging().send({
          //   token: tokenData.token,
          //   notification: {
          //     title: payload.title,
          //     body: payload.message,
          //   },
          //   data: {
          //     type: payload.type,
          //     ...payload.data,
          //   },
          //   android: {
          //     priority: 'high',
          //   },
          //   apns: {
          //     payload: {
          //       aps: {
          //         sound: 'default',
          //         badge: 1,
          //       },
          //     },
          //   },
          // });

          // Pour l'instant, simuler l'envoi
          console.log('✅ [Push Service] Notification sent to token:', tokenData.token.substring(0, 20) + '...');
        } catch (error: any) {
          console.error('❌ [Push Service] Error sending to token:', error);

          // Si le token est invalide, le désactiver
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            await this.repository.deactivatePushToken(tokenData.token);
          }
        }
      });

      await Promise.allSettled(promises);

      console.log('✅ [Push Service] Push notifications sent');
    } catch (error: any) {
      console.error('❌ [Push Service] Error:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification Web Push (pour PWA)
   */
  async sendWebPush(
    userId: string,
    payload: ServiceBusNotificationPayload
  ): Promise<void> {
    try {
      console.log('🌐 [Push Service] Sending web push to user:', userId);

      const tokens = await this.repository.getPushTokens(userId);
      const webTokens = tokens.filter(t => t.deviceType === 'web');

      if (webTokens.length === 0) {
        console.log('⚠️ [Push Service] No web push tokens found');
        return;
      }

      // Implémenter avec web-push library
      // const webpush = require('web-push');
      // 
      // webpush.setVapidDetails(
      //   'mailto:' + process.env.VAPID_EMAIL,
      //   process.env.VAPID_PUBLIC_KEY,
      //   process.env.VAPID_PRIVATE_KEY
      // );
      //
      // const notificationPayload = JSON.stringify({
      //   title: payload.title,
      //   body: payload.message,
      //   icon: '/icon-192x192.png',
      //   badge: '/badge-72x72.png',
      //   data: payload.data,
      // });
      //
      // const promises = webTokens.map(token =>
      //   webpush.sendNotification(
      //     JSON.parse(token.token),
      //     notificationPayload
      //   )
      // );
      //
      // await Promise.allSettled(promises);

      console.log('✅ [Push Service] Web push notifications sent');
    } catch (error: any) {
      console.error('❌ [Push Service] Error sending web push:', error);
      throw error;
    }
  }
}