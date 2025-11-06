import { NextResponse } from 'next/server';
import { getReviewsByOwnerId } from '@/features/reviews/infrastructure/review.repository';
import { Review, calculateReviewStatistics, mapDbSentimentToUI } from '@/features/reviews/types';

// This is a placeholder for getting the authenticated user's ID.
async function getAuthenticatedOwnerId(): Promise<string | null> {
  // TODO: Implement actual authentication logic.
  return "420430c2-0338-4612-aa74-65f0a82900fe"; // Example ownerId from db.txt
}

export async function GET() {
  try {
    const ownerId = await getAuthenticatedOwnerId();

    if (!ownerId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await getReviewsByOwnerId(ownerId);

    const processedReviews: Review[] = reviews.map(review => ({
      ...review,
      sentiment: mapDbSentimentToUI(review),
    }));

    const statistics = calculateReviewStatistics(processedReviews);

    return NextResponse.json({ reviews: processedReviews, statistics });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
