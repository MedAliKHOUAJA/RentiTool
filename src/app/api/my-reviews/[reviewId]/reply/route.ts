import { NextRequest, NextResponse } from 'next/server';
import { upsertReviewReply } from '@/features/reviews/infrastructure/review.repository';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';

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

    console.log('[API REPLY] - Calling upsertReviewReply...');
    await upsertReviewReply(reviewId, responderId, responseText);
    console.log('[API REPLY] - upsertReviewReply completed successfully.');

    return NextResponse.json({ message: 'Reply saved successfully' });
  } catch (error) {
    console.error('[API REPLY] - CRITICAL ERROR in catch block:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}