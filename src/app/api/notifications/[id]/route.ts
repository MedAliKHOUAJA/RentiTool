import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PostgresNotificationRepository } from '@/features/notifications/infrastructure/postgres-notification.repository';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer une notification par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📥 [API Notification ID] GET - Start for ID:', params.id);

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const notificationId = parseInt(params.id);

    // Récupérer la notification
    const repository = new PostgresNotificationRepository();
    const notification = await repository.findById(notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Vérifier que la notification appartient à l'utilisateur
    if (notification.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('✅ [API Notification ID] GET - Success');

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error('❌ [API Notification ID] GET - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprimer une notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ [API Notification ID] DELETE - Start for ID:', params.id);

    // Vérifier l'authentification
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const notificationId = parseInt(params.id);

    // Vérifier que la notification appartient à l'utilisateur
    const repository = new PostgresNotificationRepository();
    const notification = await repository.findById(notificationId);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Supprimer la notification
    await repository.delete(notificationId);

    console.log('✅ [API Notification ID] DELETE - Success');

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [API Notification ID] DELETE - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}