import { NextRequest, NextResponse } from 'next/server';
import { getReviewsForOwner } from '@/features/reviews/infrastructure/review.repository';
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

    const reviews = await getReviewsForOwner(ownerId);

    const processedReviews: Review[] = reviews.map(review => ({
      ...review,
      sentiment: mapDbSentimentToUI(review),
    }));

    return NextResponse.json({ reviews: processedReviews });
  } catch (error) {
    console.error('Error fetching reviews about owner:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}