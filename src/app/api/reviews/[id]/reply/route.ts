import { NextRequest, NextResponse } from 'next/server';
import { upsertReviewReply, getReviewDetailsForNotification } from '@/features/reviews/infrastructure/review.repository';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { NotificationService } from '@/features/notifications/application/services/notification.service';
import { AzureServiceBusService } from '@/features/notifications/infrastructure/azure-service-bus.service';
import { NotificationType, NotificationPriority } from '@/features/notifications/domain/notification.types';
import { PostgresNotificationRepository } from '@/features/notifications/infrastructure/postgres-notification.repository';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Récupération dynamique de l'utilisateur authentifié
    const responderId = getUserIdFromToken(request);

    if (!responderId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const ratingId = parseInt(params.id, 10);
    if (isNaN(ratingId)) {
      return NextResponse.json({ message: 'Invalid Rating ID' }, { status: 400 });
    }

    const { responseText } = await request.json();

    if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
      return NextResponse.json({ message: 'Response text is required' }, { status: 400 });
    }

    // 1️⃣ Sauvegarder la réponse
    await upsertReviewReply(ratingId, responderId, responseText);

    // 2️⃣ 🔔 Envoyer la notification au reviewer
    try {
      console.log('🔔 [ReviewReply] Starting notification process...');
      
      // ✅ Utiliser la fonction existante du repository
      const reviewDetails = await getReviewDetailsForNotification(ratingId);

      if (!reviewDetails) {
        console.warn('⚠️ [ReviewReply] Review not found for notification');
        return NextResponse.json({ message: 'Reply saved successfully' });
      }

      console.log('📦 [ReviewReply] Review details retrieved:', {
        toolName: reviewDetails.toolName,
        reviewerUserId: reviewDetails.reviewerUserId,
        ownerName: reviewDetails.ownerName,
      });

      // Vérifier que le répondeur est bien le propriétaire
      if (responderId !== reviewDetails.ownerId) {
        console.warn('⚠️ [ReviewReply] Responder is not the owner, skipping notification');
        return NextResponse.json({ message: 'Reply saved successfully' });
      }

      // 3️⃣ 🔔 Envoyer la notification
      console.log('📤 [ReviewReply] Sending notification to reviewer:', reviewDetails.reviewerUserId);

      const repository = new PostgresNotificationRepository();
      const serviceBusService = new AzureServiceBusService();
      const notificationService = new NotificationService(repository, serviceBusService);

      await notificationService.sendNotification({
        type: NotificationType.REVIEW_REPLY,
        userId: reviewDetails.reviewerUserId,
        title: '💬 Réponse à votre avis',
        message: `${reviewDetails.ownerName} a répondu à votre avis sur "${reviewDetails.toolName}".`,
        data: {
          ratingId: reviewDetails.reviewId,
          toolId: reviewDetails.toolId,
          toolName: reviewDetails.toolName,
          ownerName: reviewDetails.ownerName,
          ownerId: reviewDetails.ownerId,
          reviewerFirstName: reviewDetails.reviewerFirstName,
          responseText: responseText.substring(0, 200),
          communication: reviewDetails.communication,
          toolStatus: reviewDetails.toolStatus,
          ponctuality: reviewDetails.ponctuality,
          fiability: reviewDetails.fiability,
        },
        priority: NotificationPriority.MEDIUM,
        toolId: reviewDetails.toolId,
        ratingId: reviewDetails.reviewId,
      });

      console.log('✅ [ReviewReply] Notification sent successfully to reviewer:', reviewDetails.reviewerUserId);
    } catch (notifError: any) {
      // Ne pas bloquer la sauvegarde de la réponse si la notification échoue
      console.error('❌ [ReviewReply] Failed to send notification:', notifError);
      console.error('❌ [ReviewReply] Error details:', notifError.message);
    }

    return NextResponse.json({ message: 'Reply saved successfully' });
  } catch (error) {
    console.error('Error saving reply:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}