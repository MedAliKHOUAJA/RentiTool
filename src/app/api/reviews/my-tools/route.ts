import { NextResponse } from 'next/server';
import { getReviewsByOwnerId } from '@/features/reviews/infrastructure/review.repository';
import { Review, calculateReviewStatistics, mapDbSentimentToUI } from '@/features/reviews/types';

// This is a placeholder for getting the authenticated user's ID.
// In a real application, you would get this from your authentication system (e.g., NextAuth.js session).
async function getAuthenticatedOwnerId(): Promise<string | null> {
  // TODO: Implement actual authentication logic to get the current user's ID.
  // For now, returning a hardcoded ID or null.
  // You might use `getServerSession` from 'next-auth' or similar.
  return "420430c2-0338-4612-aa74-65f0a82900fe"; // Example ownerId from db.txt
}

export async function GET() {
  try {
    const ownerId = await getAuthenticatedOwnerId();

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
