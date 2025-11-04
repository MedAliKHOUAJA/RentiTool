
export type FeelingTypeId = 1 | 2 | 3 | 4;

export const FeelingTypeMap = {
  1: 'positive',
  2: 'negative',
  3: 'neutral',
  4: 'mixed',
} as const;

export const FeelingTypeReverseMap = {
  positive: 1,
  negative: 2,
  neutral: 3,
  mixed: 4,
} as const;

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidenceScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  rating: number;
}


export interface Review {
  ratingId: number;
  rentalId: number;
  raterId: string;
  ratedUserId?: string;
  ratedToolId?: string;
  ratedEntityTypeId: 1 | 2 | 3; // 1=Tool, 2=Rater, 3=Rated
  
  // Reviewer info (à joindre depuis Users)
  reviewer: {
    id: string;
    name: string;
    avatar?: string;
  };
  
  // Ratings
  communication?: number;      // Pour les users
  toolStatus?: number;         // Pour les tools (anciennement toolCondition)
  ponctuality?: number;        // Pour les users
  fiability?: number;          // Pour les tools
  
  comment?: string;
  
  // Sentiment Analysis (mapping avec votre DB)
  feelingTypeId?: FeelingTypeId;
  feelingScorePositive?: number;
  feelingScoreNegative?: number;
  feelingScoreNeutral?: number;
  feelingScoreMixed?: number;
  
  // Computed sentiment (pour l'UI)
  sentiment?: SentimentAnalysis;
  
  images?: string[];
  response?: string;
  respondedAt?: Date;
  createdAt: Date;
}

export interface CreateReviewDto {
  rentalId: number;
  raterId: string;
  ratedUserId?: string;
  ratedToolId?: string;
  ratedEntityTypeId: 1 | 2 | 3;
  
  // Ratings selon le type
  communication?: number;
  toolStatus?: number;
  ponctuality?: number;
  fiability?: number;
  
  comment?: string;
  images?: string[];
}
  
export interface ReviewStatistics {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  sentimentDistribution?: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
}

function validateRating(rating: number | null | undefined): number {
  if (rating === null || rating === undefined || rating === 0) return 0;
  
  // Limiter entre 1 et 5
  return Math.max(1, Math.min(5, rating));
}

// Helper pour calculer le rating principal selon le type
export function getMainRating(review: Review): number {
  if (review.ratedEntityTypeId === 1) {
    // Pour un outil
    const toolStatus = validateRating(review.toolStatus);
    const fiability = validateRating(review.fiability);
    
    if (toolStatus === 0 && fiability === 0) return 0;
    if (toolStatus === 0) return fiability;
    if (fiability === 0) return toolStatus;
    
    return (toolStatus + fiability) / 2;
    
  } else {
    // Pour un utilisateur
    const communication = validateRating(review.communication);
    const ponctuality = validateRating(review.ponctuality);
    
    if (communication === 0 && ponctuality === 0) return 0;
    if (communication === 0) return ponctuality;
    if (ponctuality === 0) return communication;
    
    return (communication + ponctuality) / 2;
  }
}

// Helper pour convertir le sentiment DB vers l'UI
export function mapDbSentimentToUI(review: Review): SentimentAnalysis | undefined {
  if (!review.feelingTypeId) return undefined;
  
  const sentiment = FeelingTypeMap[review.feelingTypeId];
  
  return {
    sentiment,
    confidenceScores: {
      positive: review.feelingScorePositive || 0,
      negative: review.feelingScoreNegative || 0,
      neutral: review.feelingScoreNeutral || 0,
    },
    rating: getMainRating(review),
  };
}

export function calculateReviewStatistics(reviews: Review[]): ReviewStatistics {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
    };
  }

  // Calculer la moyenne avec getMainRating
  const totalRating = reviews.reduce((acc, review) => acc + getMainRating(review), 0);
  const averageRating = totalRating / reviews.length;

  // Distribution par étoiles (arrondi à l'entier le plus proche)
  const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  };

  reviews.forEach(review => {
    const rating = Math.round(getMainRating(review));
    if (rating >= 1 && rating <= 5) {
      distribution[rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  // Distribution par sentiment
  const sentimentDistribution = {
    positive: reviews.filter(r => r.sentiment?.sentiment === 'positive').length,
    negative: reviews.filter(r => r.sentiment?.sentiment === 'negative').length,
    neutral: reviews.filter(r => r.sentiment?.sentiment === 'neutral').length,
    mixed: reviews.filter(r => r.sentiment?.sentiment === 'mixed').length,
  };

  return {
    averageRating,
    totalReviews: reviews.length,
    distribution,
    sentimentDistribution,
  };
}
