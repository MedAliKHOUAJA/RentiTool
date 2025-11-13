import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { GetUserNotificationsUseCase } from '@/features/notifications/application/use-cases/get-user-notifications.use-case';
import { SendNotificationUseCase } from '@/features/notifications/application/use-cases/send-notification.use-case';
import { NotificationType, NotificationPriority } from '@/features/notifications/domain/notification.types';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer les notifications de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 [API Notifications] GET - Start');

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    console.log('🔍 [API Notifications] Parameters:', { 
      userId: decoded.userId, 
      limit, 
      unreadOnly, 
      offset 
    });

    // Exécuter le use case
    const useCase = new GetUserNotificationsUseCase();
    const result = await useCase.execute({
      userId: decoded.userId,
      limit,
      unreadOnly,
      offset,
    });

    if (!result.success) {
      console.error('❌ [API Notifications] Use case failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ [API Notifications] GET - Success', {
      count: result.notifications?.length || 0,
      unreadCount: result.unreadCount
    });

    // ✅ CORRECTION : Adapter le format de réponse
    return NextResponse.json({
      notifications: result.notifications || [],
      unreadCount: result.unreadCount || 0,
      total: result.notifications?.length || 0, // ✅ Ajouter total
    });
  } catch (error: any) {
    console.error('❌ [API Notifications] GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Créer une nouvelle notification (usage interne)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API Notifications] POST - Start');

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      data,
      priority,
      toolId,
      rentalId,
      ratingId,
    } = body;

    // Validation
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Exécuter le use case
    const useCase = new SendNotificationUseCase();
    const result = await useCase.execute({
      userId,
      type: type as NotificationType,
      title,
      message,
      data,
      priority: priority as NotificationPriority,
      toolId,
      rentalId,
      ratingId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ [API Notifications] POST - Success');

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
    });
  } catch (error: any) {
    console.error('❌ [API Notifications] POST - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}