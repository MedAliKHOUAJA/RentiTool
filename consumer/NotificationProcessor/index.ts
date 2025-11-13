import { app, InvocationContext, ServiceBusQueueHandler } from '@azure/functions';
import { ServiceBusNotificationPayload, NotificationChannel } from '../shared/types';
import { EmailService } from '../shared/email.service';
import { query } from '../shared/db';

/**
 * Normaliser les noms de canaux (gérer minuscules/majuscules et underscores)
 */
function normalizeChannel(channel: string): string {
  return channel.toUpperCase().replace(/-/g, '_');
}

/**
 * Vérifier si un canal est demandé (insensible à la casse)
 */
function hasChannel(channels: string[], targetChannel: NotificationChannel): boolean {
  const normalizedChannels = channels.map(c => normalizeChannel(c));
  const normalizedTarget = normalizeChannel(targetChannel);
  return normalizedChannels.includes(normalizedTarget);
}

const serviceBusQueueTrigger: ServiceBusQueueHandler = async (
  message: ServiceBusNotificationPayload,
  context: InvocationContext
): Promise<void> => {
  const startTime = Date.now();
  const invocationId = context.invocationId;

  context.log('');
  context.log('╔════════════════════════════════════════════════════╗');
  context.log('║   📨 Processing Notification                       ║');
  context.log('╚════════════════════════════════════════════════════╝');
  context.log('');
  context.log('🆔 Invocation ID:', invocationId);
  context.log('📋 Type:', message.type);
  context.log('👤 Recipient:', message.recipientUserId);
  context.log('📝 Title:', message.title);
  context.log('⏰ Timestamp:', message.metadata?.timestamp);
  context.log('');

  try {
    // 1️⃣ Récupérer l'utilisateur et ses préférences
    context.log('🔍 [Step 1] Fetching user and preferences...');

    const userResult = await query(
      `SELECT 
        u."userId" as "userId",
        u."Email" as "email", 
        u."FirstName" as "firstName", 
        u."LastName" as "lastName",
        COALESCE(p."EnableEmail", true) as "enableEmail",
        COALESCE(p."EnableInApp", true) as "enableInApp",
        COALESCE(p."EnablePush", false) as "enablePush"
       FROM "User" u
       LEFT JOIN "NotificationPreferences" p ON u."userId" = p."UserId"
       WHERE u."userId" = $1`,
      [message.recipientUserId]
    );

    if (userResult.rows.length === 0) {
      context.warn('⚠️ User not found:', message.recipientUserId);
      context.log('✅ Message consumed (user not found)');
      return;
    }

    const user = userResult.rows[0];

    context.log('✅ User found:', {
      email: user.email,
      firstName: user.firstName,
      enableEmail: user.enableEmail,
    });

    if (!user.email) {
      context.warn('⚠️ User has no email address');
      context.log('✅ Message consumed (no email)');
      return;
    }

    // 2️⃣ Vérifier les canaux et préférences
    const channels = message.metadata?.channels || [NotificationChannel.EMAIL];
    
    context.log('');
    context.log('📢 Channels requested:', channels.join(', '));
    context.log('⚙️ User preferences:', {
      email: user.enableEmail,
      inApp: user.enableInApp,
      push: user.enablePush,
    });

    // 3️⃣ Traiter l'email si demandé et autorisé
    // ✅ CORRECTION : Utiliser hasChannel() pour gérer la casse
    if (hasChannel(channels, NotificationChannel.EMAIL) && user.enableEmail) {
      context.log('');
      context.log('📧 [Step 2] Sending email...');
      context.log('   To:', user.email);

      const emailService = new EmailService();
      await emailService.send(user.email, message);

      context.log('✅ Email sent successfully');

      // Optionnel : Mettre à jour la notification en base
      if (message.data?.notificationId) {
        await query(
          `UPDATE "Notifications" 
           SET "UpdatedAt" = CURRENT_TIMESTAMP 
           WHERE "NotificationId" = $1`,
          [message.data.notificationId]
        );
        context.log('✅ Notification updated in database');
      }
    } else if (!user.enableEmail) {
      context.log('⏭️ Email notifications disabled by user');
    } else {
      context.log('⏭️ Email not in requested channels');
      context.log('   Requested:', channels);
      context.log('   Looking for:', NotificationChannel.EMAIL);
    }

    // 4️⃣ Autres canaux (TODO)
    if (hasChannel(channels, NotificationChannel.IN_APP)) {
      context.log('🔔 In-app notification (not implemented yet)');
      // TODO: WebSocket / SignalR
    }

    if (hasChannel(channels, NotificationChannel.PUSH)) {
      context.log('📱 Push notification (not implemented yet)');
      // TODO: Firebase Cloud Messaging / Apple Push Notification
    }

    // ✅ Succès
    const duration = Date.now() - startTime;
    context.log('');
    context.log('╔════════════════════════════════════════════════════╗');
    context.log('║   ✅ Processing Complete                          ║');
    context.log('╚════════════════════════════════════════════════════╝');
    context.log(`⏱️ Duration: ${duration}ms`);
    context.log('');

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    context.log('');
    context.log('╔════════════════════════════════════════════════════╗');
    context.log('║   ❌ Processing Failed                            ║');
    context.log('╚════════════════════════════════════════════════════╝');
    context.error('❌ Error:', error.message);
    context.error('❌ Stack:', error.stack);
    context.log(`⏱️ Failed after: ${duration}ms`);
    context.log('');
    context.log('🔄 Azure Service Bus will retry this message automatically');
    context.log('');

    // Re-throw pour que Azure Service Bus gère le retry
    throw error;
  }
};

// Enregistrement de la fonction
app.serviceBusQueue('NotificationProcessor', {
  queueName: 'notifications-queue',
  connection: 'AZURE_SERVICE_BUS_CONNECTION_STRING',
  handler: serviceBusQueueTrigger,
});