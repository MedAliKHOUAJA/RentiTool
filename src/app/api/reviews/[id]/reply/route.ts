import { NextRequest, NextResponse } from 'next/server';
import { upsertReviewReply } from '@/features/reviews/infrastructure/review.repository';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Récupération dynamique de l'utilisateur authentifié
    const responderId = getUserIdFromToken(request);

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