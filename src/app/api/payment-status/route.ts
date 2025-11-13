import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PaymentStatusType } from '@/data/types';

export async function GET() {
  try {
    const result = await query(`
      SELECT "Statusid" as statusId, "StatusName" as statusName 
      FROM "RentalsPaymentStatus" 
      ORDER BY "Statusid"
    `);

    const statuses: PaymentStatusType[] = result.rows.map((row: any) => ({
      statusId: row.statusId,
      statusName: row.statusName
    }));

    return NextResponse.json(statuses);
  } catch (err: any) {
    console.error("/api/payment-status GET error:", err?.message || err);
    return NextResponse.json({ 
      error: `Failed to fetch payment statuses: ${err?.message || err}` 
    }, { status: 500 });
  }
}
