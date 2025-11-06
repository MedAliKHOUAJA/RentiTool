import { NextResponse } from 'next/server';
import { upsertReviewReply } from '@/features/reviews/infrastructure/review.repository';

// Placeholder for getting the authenticated user's ID.
async function getAuthenticatedResponderId(): Promise<string | null> {
  // TODO: Implement actual authentication logic.
  return "420430c2-0338-4612-aa74-65f0a82900fe"; // Example ownerId from db.txt
}

export async function POST(
  request: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    console.log('[API REPLY] - Received request');
    const responderId = await getAuthenticatedResponderId();

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

    console.log('[API REPLY] - Calling upsertReviewReply...');
    await upsertReviewReply(reviewId, responderId, responseText);
    console.log('[API REPLY] - upsertReviewReply completed successfully.');

    return NextResponse.json({ message: 'Reply saved successfully' });
  } catch (error) {
    console.error('[API REPLY] - CRITICAL ERROR in catch block:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
