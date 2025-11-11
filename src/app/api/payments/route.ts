import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PaymentDataType, PaymentCreateRequest } from '@/data/types';

// GET /api/payments - Get all payments with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rentalId = searchParams.get('rentalId');
    const statusId = searchParams.get('statusId');
    const userId = searchParams.get('userId'); // For filtering by owner or renter

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (rentalId) {
      whereClause += ` WHERE p."RentalId" = $${paramIndex}`;
      params.push(rentalId);
      paramIndex++;
    }

    if (statusId) {
      whereClause += whereClause ? ` AND p."PaymentStatusId" = $${paramIndex}` : ` WHERE p."PaymentStatusId" = $${paramIndex}`;
      params.push(statusId);
      paramIndex++;
    }

    if (userId) {
      // Filter by user (either as owner or renter)
      whereClause += whereClause ? ` AND (r."OwnerId" = $${paramIndex} OR r."RenterId" = $${paramIndex})` : ` WHERE (r."OwnerId" = $${paramIndex} OR r."RenterId" = $${paramIndex})`;
      params.push(userId);
    }

    const sql = `
      SELECT 
        p."PaymentId",
        p."Amount",
        p."PaymentStatusId",
        p."PaymentTypeId",
        p."PaymentDate",
        p."RentalId",
        ps."StatusName",
        pt."TypeName",
        r."ToolId",
        r."RentalDateStart",
        r."RentalDateEnd"
      FROM "RentalsPayments" p
      LEFT JOIN "RentalsPaymentStatus" ps ON p."PaymentStatusId" = ps."Statusid"
      LEFT JOIN "RentalsPaymentType" pt ON p."PaymentTypeId" = pt."TypeId"
      LEFT JOIN "Rentals" r ON p."RentalId" = r."RentalId"
      ${whereClause}
      ORDER BY p."PaymentId" DESC
    `;

    const result = await query(sql, params);
    
    const payments: PaymentDataType[] = result.rows.map((row: any) => ({
      paymentId: row.PaymentId,
      amount: parseFloat(row.Amount),
      paymentStatusId: row.PaymentStatusId,
      paymentTypeId: row.PaymentTypeId,
      paymentDate: row.PaymentDate,
      rentalId: row.RentalId,
      statusName: row.StatusName,
      typeName: row.TypeName,
      rentalInfo: {
        toolName: `Outil #${row.ToolId}`,
        toolId: row.ToolId,
        rentalDateStart: row.RentalDateStart,
        rentalDateEnd: row.RentalDateEnd
      }
    }));

    return NextResponse.json(payments);
  } catch (err: any) {
    console.error("/api/payments GET error:", err?.message || err);
    return NextResponse.json({ 
      error: `Failed to fetch payments: ${err?.message || err}` 
    }, { status: 500 });
  }
}

// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const body: PaymentCreateRequest = await request.json();
    const { amount, paymentTypeId, rentalId, paymentStatusId = 1 } = body;

    // Validate required fields
    if (!amount || !paymentTypeId || !rentalId) {
      return NextResponse.json({ error: 'Missing required fields: amount, paymentTypeId, rentalId' }, { status: 400 });
    }

    // Check if rental exists
    const rentalCheck = await query(`
      SELECT "RentalId" FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    if (rentalCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Insert new payment
    const insertResult = await query(`
      INSERT INTO "RentalsPayments" (
        "Amount", 
        "PaymentStatusId", 
        "PaymentTypeId", 
        "PaymentDate", 
        "RentalId"
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4)
      RETURNING 
        "PaymentId",
        "Amount",
        "PaymentStatusId",
        "PaymentTypeId",
        "PaymentDate",
        "RentalId"
    `, [amount, paymentStatusId, paymentTypeId, rentalId]);

    const newPayment = insertResult.rows[0];
    
    return NextResponse.json({
      success: true,
      payment: {
        paymentId: newPayment.PaymentId,
        amount: parseFloat(newPayment.Amount),
        paymentStatusId: newPayment.PaymentStatusId,
        paymentTypeId: newPayment.PaymentTypeId,
        paymentDate: newPayment.PaymentDate,
        rentalId: newPayment.RentalId
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error("/api/payments POST error:", err?.message || err);
    return NextResponse.json({ error: `Failed to create payment: ${err?.message || err}` }, { status: 500 });
  }
}
