import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PaymentTypeType } from '@/data/types';

export async function GET() {
  try {
    const result = await query(`
      SELECT "TypeId", "TypeName" 
      FROM "RentalsPaymentType" 
      ORDER BY "TypeId"
    `);

    const types: PaymentTypeType[] = result.rows.map((row: any) => ({
      typeId: row.TypeId,
      typeName: row.TypeName
    }));

    return NextResponse.json(types);
  } catch (err: any) {
    console.error("/api/payment-types GET error:", err?.message || err);
    return NextResponse.json({ 
      error: `Failed to fetch payment types: ${err?.message || err}` 
    }, { status: 500 });
  }
}
