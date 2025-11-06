import { NextResponse } from 'next/server';
import { upsertReviewReply } from '@/features/reviews/infrastructure/review.repository';

// Placeholder for getting the authenticated user's ID.
async function getAuthenticatedResponderId(): Promise<string | null> {
  // TODO: Implement actual authentication logic.
  return "420430c2-0338-4612-aa74-65f0a82900fe"; // Example ownerId from db.txt
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const responderId = await getAuthenticatedResponderId();

    if (!responderId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const ratingId = parseInt(params.id, 10);
    if (isNaN(ratingId)) {
      return NextResponse.json({ message: 'Invalid Rating ID' }, { status: 400 });
    }

    const { responseText } = await request.json();

    if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
      return NextResponse.json({ message: 'Response text is required' }, { status: 400 });
    }

    await upsertReviewReply(ratingId, responderId, responseText);

    return NextResponse.json({ message: 'Reply saved successfully' });
  } catch (error) {
    console.error('Error saving reply:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
