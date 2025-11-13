import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MarkAsReadUseCase } from '@/features/notifications/application/use-cases/mark-as-read.use-case';

export const dynamic = 'force-dynamic';

/**
 * POST - Marquer une ou toutes les notifications comme lues
 */
export async function POST(request: NextRequest) {
  try {
    console.log('✓ [API Mark Read] POST - Start');

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
    const { notificationId, markAll } = body;

    const useCase = new MarkAsReadUseCase();

    if (markAll) {
      // Marquer toutes comme lues
      const result = await useCase.executeAll(decoded.userId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      console.log('✅ [API Mark Read] POST - All marked as read');

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else {
      // Marquer une seule comme lue
      if (!notificationId) {
        return NextResponse.json(
          { error: 'Missing notificationId' },
          { status: 400 }
        );
      }

      const result = await useCase.execute(notificationId, decoded.userId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: result.error === 'Unauthorized' ? 403 : 500 }
        );
      }

      console.log('✅ [API Mark Read] POST - Notification marked as read');

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }
  } catch (error: any) {
    console.error('❌ [API Mark Read] POST - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}