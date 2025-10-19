import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/payments/[id] - Get specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    const result = await query(`
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
      WHERE p."PaymentId" = $1
    `, [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = result.rows[0];
    
    return NextResponse.json({
      paymentId: payment.PaymentId,
      amount: parseFloat(payment.Amount),
      paymentStatusId: payment.PaymentStatusId,
      paymentTypeId: payment.PaymentTypeId,
      paymentDate: payment.PaymentDate,
      rentalId: payment.RentalId,
      statusName: payment.StatusName,
      typeName: payment.TypeName,
      rentalInfo: {
        toolName: `Outil #${payment.ToolId}`,
        toolId: payment.ToolId,
        rentalDateStart: payment.RentalDateStart,
        rentalDateEnd: payment.RentalDateEnd
      }
    });
  } catch (err: any) {
    console.error("/api/payments/[id] GET error:", err?.message || err);
    return NextResponse.json({ error: `Failed to fetch payment: ${err?.message || err}` }, { status: 500 });
  }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;
    const body = await request.json();
    const { paymentStatusId } = body;

    if (!paymentStatusId) {
      return NextResponse.json({ error: 'paymentStatusId is required' }, { status: 400 });
    }

    // Check if payment exists
    const existingPayment = await query(`
      SELECT "PaymentId" FROM "RentalsPayments" WHERE "PaymentId" = $1
    `, [paymentId]);

    if (existingPayment.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    await query(`
      UPDATE "RentalsPayments" 
      SET "PaymentStatusId" = $1 
      WHERE "PaymentId" = $2
    `, [paymentStatusId, paymentId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Payment status updated successfully' 
    });
  } catch (err: any) {
    console.error("/api/payments/[id] PUT error:", err?.message || err);
    return NextResponse.json({ error: `Failed to update payment: ${err?.message || err}` }, { status: 500 });
  }
}
