import { NextRequest, NextResponse } from 'next/server';
import { getReviewsByOwnerId } from '@/features/reviews/infrastructure/review.repository';
import { Review, calculateReviewStatistics, mapDbSentimentToUI } from '@/features/reviews/types';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ✅ Récupération dynamique de l'utilisateur authentifié
    const ownerId = getUserIdFromToken(request);

    if (!ownerId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await getReviewsByOwnerId(ownerId);

    // Process reviews to include reviewer info and sentiment analysis for UI
    const processedReviews: Review[] = reviews.map(review => ({
      ...review,
      reviewer: {
        id: review.raterId,
        name: review.reviewer.name, // Already populated by the repository
      },
      sentiment: mapDbSentimentToUI(review),
    }));

    // Calculate statistics
    const statistics = calculateReviewStatistics(processedReviews);

    return NextResponse.json({ reviews: processedReviews, statistics });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}