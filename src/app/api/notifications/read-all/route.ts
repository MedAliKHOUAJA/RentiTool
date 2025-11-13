import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { query } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📖 [API Notifications] Mark all as read', { userId });

    // Marquer toutes les notifications comme lues
    const result = await query(
      `UPDATE "Notifications"
       SET "IsRead" = true, "ReadAt" = CURRENT_TIMESTAMP
       WHERE "UserId" = $1 AND "IsRead" = false
       RETURNING "NotificationId"`,
      [userId]
    );

    const count = result.rows.length;

    console.log('✅ [API Notifications] Marked all as read', { count });

    return NextResponse.json({ 
      success: true,
      count 
    });
  } catch (error: any) {
    console.error('❌ [API Notifications] Mark all as read - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}