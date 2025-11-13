'use server';

import { CreateReviewUseCase } from "@/features/reviews/application/create-review.use-case";
import { PostgresReviewRepository } from "@/features/reviews/infrastructure/postgres-review.repository";
import { CreateReviewDto } from "@/features/reviews/types";
import { analyzeSentiment } from "../services/azure-sentiment.service";
import { NotificationService } from "@/features/notifications/application/services/notification.service";
import { AzureServiceBusService } from "@/features/notifications/infrastructure/azure-service-bus.service";
import { NotificationType, NotificationPriority } from "@/features/notifications/domain/notification.types";
import { query } from "@/db";
import { PostgresNotificationRepository } from "@/features/notifications/infrastructure/postgres-notification.repository";

export async function createReview(reviewData: CreateReviewDto) {
  try {
    // Validations côté serveur
    if (!reviewData.rentalId) {
      return { 
        success: false, 
        error: "ID de location manquant" 
      };
    }

    if (!reviewData.raterId) {
      return { 
        success: false, 
        error: "ID de l'évaluateur manquant" 
      };
    }

    if (!reviewData.ratedToolId && !reviewData.ratedUserId) {
      return { 
        success: false, 
        error: "ID d'outil ou d'utilisateur requis" 
      };
    }

    if (!reviewData.comment?.trim()) {
      return { 
        success: false, 
        error: "Le commentaire est requis" 
      };
    }

    if (reviewData.comment.trim().length < 10) {
      return { 
        success: false, 
        error: "Le commentaire doit contenir au moins 10 caractères" 
      };
    }

    // Analyser le sentiment avec Azure
    let sentimentData = null;
    if (reviewData.comment) {
      try {
        sentimentData = await analyzeSentiment(reviewData.comment);
      } catch (error) {
        console.error("Erreur analyse sentiment:", error);
        // Continue même si l'analyse échoue
      }
    }

    // Créer l'avis avec les données de sentiment
    const reviewRepository = new PostgresReviewRepository();
    const createReviewUseCase = new CreateReviewUseCase(reviewRepository);
    
    const reviewDataWithSentiment = {
      ...reviewData,
      ...(sentimentData && {
        feelingTypeId: mapSentimentToFeelingTypeId(sentimentData.sentiment),
        feelingScorePositive: sentimentData.confidenceScores.positive,
        feelingScoreNegative: sentimentData.confidenceScores.negative,
        feelingScoreNeutral: sentimentData.confidenceScores.neutral,
        feelingScoreMixed: 0, // Azure ne retourne pas mixed directement
      }),
    };

    const newReview = await createReviewUseCase.execute(reviewDataWithSentiment);
    
    // ✅ 🔔 NOUVEAU : Envoyer la notification au propriétaire
    try {
      console.log('🔔 [CreateReview] Starting notification process...');
      
      // Récupérer les infos pour la notification
      const reviewInfoResult = await query(`
        SELECT 
          t."Toolid" as tool_id,
          t."Title" as tool_name,
          t."Ownerid" as owner_id,
          owner."FirstName" || ' ' || owner."LastName" as owner_name,
          reviewer."FirstName" || ' ' || reviewer."LastName" as reviewer_name,
          r."RentalId" as rental_id
        FROM "Tools" t
        JOIN "User" owner ON t."Ownerid" = owner."userId"
        JOIN "User" reviewer ON reviewer."userId" = $1
        LEFT JOIN "Rentals" r ON r."RentalId" = $2
        WHERE t."Toolid" = $3
      `, [reviewData.raterId, reviewData.rentalId, reviewData.ratedToolId]);

      if (reviewInfoResult.rows.length > 0) {
        const info = reviewInfoResult.rows[0];

        console.log('📦 [CreateReview] Review info retrieved:', {
          toolName: info.tool_name,
          ownerName: info.owner_name,
          reviewerName: info.reviewer_name,
        });

        // Ne pas notifier si le reviewer est le propriétaire (ne devrait pas arriver)
        if (reviewData.raterId !== info.owner_id) {
          console.log('📤 [CreateReview] Sending notification to owner:', info.owner_id);

          const repository = new PostgresNotificationRepository();
          const serviceBusService = new AzureServiceBusService();
          const notificationService = new NotificationService(repository, serviceBusService);

          // Calculer la note moyenne
          const avgRating = calculateAverageRating({
            communication: reviewData.communication,
            toolStatus: reviewData.toolStatus,
            ponctuality: reviewData.ponctuality,
            fiability: reviewData.fiability,
          });

          await notificationService.sendNotification({
            type: NotificationType.NEW_REVIEW,
            userId: info.owner_id,
            title: '⭐ Nouvel avis reçu !',
            message: `${info.reviewer_name} a laissé un avis ${avgRating}/5 sur votre outil "${info.tool_name}".`,
            data: {
              ratingId: newReview.ratingId,
              toolId: info.tool_id,
              toolName: info.tool_name,
              reviewerName: info.reviewer_name,
              reviewerId: reviewData.raterId,
              rentalId: info.rental_id,
              rating: avgRating,
              comment: reviewData.comment?.substring(0, 200) || '',
              communication: reviewData.communication,
              toolStatus: reviewData.toolStatus,
              ponctuality: reviewData.ponctuality,
              fiability: reviewData.fiability,
              sentiment: sentimentData?.sentiment,
            },
            priority: NotificationPriority.HIGH,
            toolId: info.tool_id,
            rentalId: info.rental_id,
            ratingId: newReview.ratingId,
          });

          console.log('✅ [CreateReview] Notification sent successfully to owner:', info.owner_id);
        }
      } else {
        console.warn('⚠️ [CreateReview] Tool or owner not found for notification');
      }
    } catch (notifError: any) {
      // Ne pas bloquer la création de l'avis si la notification échoue
      console.error('❌ [CreateReview] Failed to send notification:', notifError);
      console.error('❌ [CreateReview] Error details:', notifError.message);
    }
    
    return { 
      success: true, 
      review: newReview,
      sentiment: sentimentData,
    };
  } catch (error: any) {
    console.error("Error creating review:", error);
    
    
    if (error.code === 'P2002') {
      return { 
        success: false, 
        error: "Vous avez déjà laissé un avis pour cette location" 
      };
    }
    
    if (error.code === 'P2003') {
      return { 
        success: false, 
        error: "Location introuvable" 
      };
    }
    
    return { 
      success: false, 
      error: error.message || "Erreur lors de la création de l'avis" 
    };
  }
}

// Helper pour mapper sentiment Azure vers FeelingTypeId
function mapSentimentToFeelingTypeId(sentiment: string): 1 | 2 | 3 | 4 {
  const map: Record<string, 1 | 2 | 3 | 4> = {
    positive: 1,
    negative: 2,
    neutral: 3,
    mixed: 4,
  };
  return map[sentiment] || 3;
}

// Helper pour calculer la note moyenne
function calculateAverageRating(scores: {
  communication?: number;
  toolStatus?: number;
  ponctuality?: number;
  fiability?: number;
}): number {
  const values = [
    scores.communication,
    scores.toolStatus,
    scores.ponctuality,
    scores.fiability,
  ].filter((v): v is number => v !== undefined && v !== null);

  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  
  return Math.round(avg * 10) / 10; // Arrondir à 1 décimale
}