import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PostgresNotificationRepository } from '@/features/notifications/infrastructure/postgres-notification.repository';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer les préférences de notification
 */
export async function GET(request: NextRequest) {
  try {
    console.log('⚙️ [API Preferences] GET - Start');

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const repository = new PostgresNotificationRepository();
    let preferences = await repository.getPreferences(decoded.userId);

    // Créer les préférences par défaut si elles n'existent pas
    if (!preferences) {
      preferences = await repository.createDefaultPreferences(decoded.userId);
    }

    console.log('✅ [API Preferences] GET - Success');

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('❌ [API Preferences] GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Mettre à jour les préférences de notification
 */
export async function PUT(request: NextRequest) {
  try {
    console.log('⚙️ [API Preferences] PUT - Start');

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const body = await request.json();
    const {
      enableInApp,
      enableEmail,
      enablePush,
      notifyOnReviewReply,
      notifyOnNewReview,
      notifyOnBookingConfirmed,
      notifyOnBookingCancelled,
      notifyOnMessageReceived,
    } = body;

    const repository = new PostgresNotificationRepository();

    // S'assurer que les préférences existent
    let preferences = await repository.getPreferences(decoded.userId);
    if (!preferences) {
      preferences = await repository.createDefaultPreferences(decoded.userId);
    }

    // Mettre à jour
    await repository.updatePreferences(decoded.userId, {
      enableInApp,
      enableEmail,
      enablePush,
      notifyOnReviewReply,
      notifyOnNewReview,
      notifyOnBookingConfirmed,
      notifyOnBookingCancelled,
      notifyOnMessageReceived,
    });

    // Récupérer les préférences mises à jour
    preferences = await repository.getPreferences(decoded.userId);

    console.log('✅ [API Preferences] PUT - Success');

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    console.error('❌ [API Preferences] PUT - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}