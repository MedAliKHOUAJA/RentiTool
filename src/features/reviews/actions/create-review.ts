'use server';

import { CreateReviewUseCase } from "@/features/reviews/application/create-review.use-case";
import { PostgresReviewRepository } from "@/features/reviews/infrastructure/postgres-review.repository";
import { CreateReviewDto } from "@/features/reviews/types";
import { analyzeSentiment } from "../services/azure-sentiment.service";

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
    
    return { 
      success: true, 
      review: newReview,
      sentiment: sentimentData,
    };
  } catch (error: any) {
    console.error("Error creating review:", error);
    
    // Gestion des erreurs Prisma
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