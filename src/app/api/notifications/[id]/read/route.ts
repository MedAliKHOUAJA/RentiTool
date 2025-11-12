import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { query } from '@/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = parseInt(params.id);

    console.log('📖 [API Notifications] Mark as read', { userId, notificationId });

    // Vérifier que la notification appartient à l'utilisateur
    const checkResult = await query(
      `SELECT "NotificationId" 
       FROM "Notifications" 
       WHERE "NotificationId" = $1 AND "UserId" = $2`,
      [notificationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Marquer comme lu
    await query(
      `UPDATE "Notifications"
       SET "IsRead" = true, "ReadAt" = CURRENT_TIMESTAMP
       WHERE "NotificationId" = $1`,
      [notificationId]
    );

    console.log('✅ [API Notifications] Marked as read');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [API Notifications] Mark as read - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}