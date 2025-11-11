import { NextRequest, NextResponse } from 'next/server';
import { getReviewDetailsForNotification, upsertReviewReply } from '@/features/reviews/infrastructure/review.repository';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { NotificationType, sendNotification } from '@/lib/notifications/notification.Service';

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    console.log('[API REPLY] - Received request');
    
    // ✅ Récupération dynamique de l'utilisateur authentifié
    const responderId = getUserIdFromToken(request);

    if (!responderId) {
      console.error('[API REPLY] - Unauthorized: No responderId found.');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[API REPLY] - Authenticated responderId: ${responderId}`);

    console.log(`[API REPLY] - Raw reviewId from params: ${params.reviewId}`);
    const reviewId = parseInt(params.reviewId, 10);
    if (isNaN(reviewId)) {
      console.error(`[API REPLY] - Invalid Review ID: ${params.reviewId}`);
      return NextResponse.json({ message: 'Invalid Review ID' }, { status: 400 });
    }
    console.log(`[API REPLY] - Parsed reviewId: ${reviewId}`);

    const { responseText } = await request.json();
    console.log(`[API REPLY] - Received responseText: "${responseText}"`);

    if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
      console.error('[API REPLY] - Validation failed: responseText is empty or invalid.');
      return NextResponse.json({ message: 'Response text is required' }, { status: 400 });
    }

    // 1️⃣ Sauvegarder la réponse en base de données
    console.log('[API REPLY] - Calling upsertReviewReply...');
    await upsertReviewReply(reviewId, responderId, responseText);
    console.log('[API REPLY] - upsertReviewReply completed successfully.');

    // 2️⃣ Récupérer les détails du review pour la notification
    console.log('[API REPLY] - Fetching review details for notification...');
    const reviewDetails = await getReviewDetailsForNotification(reviewId);
    
    if (!reviewDetails) {
      console.error(`[API REPLY] - Review details not found for reviewId: ${reviewId}`);
      // On continue quand même, la réponse est sauvegardée
      return NextResponse.json({ 
        message: 'Reply saved successfully',
        warning: 'Notification not sent - review details not found' 
      });
    }

    // 3️⃣ Envoyer la notification via Azure Service Bus
    console.log('[API REPLY] - Sending notification via Azure Service Bus...');
    try {
      await sendNotification({
        type: NotificationType.REVIEW_REPLY,
        recipientUserId: reviewDetails.reviewerUserId,
        data: {
          reviewId: reviewId,
          toolId: reviewDetails.toolId,
          toolName: reviewDetails.toolName,
          ownerId: responderId,
          ownerName: reviewDetails.ownerName,
          replyText: responseText,
          originalComment: reviewDetails.originalComment,
          //reviewRating: reviewDetails,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          priority: "medium",
        },
      });
      console.log('[API REPLY] - Notification sent successfully to Azure Service Bus');
    } catch (notifError) {
      // ⚠️ Ne pas faire échouer la requête si la notification échoue
      console.error('[API REPLY] - Failed to send notification:', notifError);
      // Log pour monitoring (vous pouvez intégrer Application Insights ici)
    }

    return NextResponse.json({ message: 'Reply saved successfully' });
  } catch (error) {
    console.error('[API REPLY] - CRITICAL ERROR in catch block:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}