import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    console.log('GET /api/tools/[id]/blocked-dates - toolId:', toolId);

    // Get all confirmed and pending rentals for this tool
    const result = await query(`
      SELECT 
        "RentalDateStart",
        "RentalDateEnd",
        "StatusId"
      FROM "Rentals" 
      WHERE "ToolId" = $1 
      AND "StatusId" IN (1, 2) -- Pending and Confirmed statuses
      ORDER BY "RentalDateStart"
    `, [toolId]);

    const blockedDates = result.rows.map((row: any) => ({
      startDate: row.RentalDateStart,
      endDate: row.RentalDateEnd,
      statusId: row.StatusId,
      statusName: row.StatusId === 1 ? 'Pending' : 'Confirmed'
    }));

    return NextResponse.json({
      toolId: parseInt(toolId),
      blockedDates,
      totalBlocked: blockedDates.length
    });
  } catch (err: any) {
    console.error("/api/tools/[id]/blocked-dates GET error:", err?.message || err);
    return NextResponse.json({ error: `Failed to fetch blocked dates: ${err?.message || err}` }, { status: 500 });
  }
}
