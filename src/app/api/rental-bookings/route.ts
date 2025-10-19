import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RentalDataType, RentalCreateRequest } from '@/data/types';

// GET /api/rental-bookings - Get all rental bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get('statusId');
    const userId = searchParams.get('userId');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (statusId) {
      whereClause += ` WHERE r."StatusId" = $${paramIndex}`;
      params.push(statusId);
      paramIndex++;
    }

    if (userId) {
      whereClause += whereClause ? ` AND (r."OwnerId" = $${paramIndex} OR r."RenterId" = $${paramIndex})` : ` WHERE (r."OwnerId" = $${paramIndex} OR r."RenterId" = $${paramIndex})`;
      params.push(userId);
    }

    const sql = `
      SELECT 
        r."RentalId",
        r."ToolId",
        r."OwnerId",
        r."RenterId",
        r."TotalPrice",
        r."RentalDateStart",
        r."RentalDateEnd",
        r."StatusId",
        r."CreatedAt",
        r."UpdatedAt"
      FROM "Rentals" r
      ${whereClause}
      ORDER BY r."RentalId" DESC
    `;

    const result = await query(sql, params);
    
    const rentals: RentalDataType[] = result.rows.map((row: any) => ({
      rentalId: row.RentalId,
      toolId: row.ToolId,
      ownerId: row.OwnerId,
      renterId: row.RenterId,
      totalPrice: parseFloat(row.TotalPrice),
      rentalDateStart: row.RentalDateStart,
      rentalDateEnd: row.RentalDateEnd,
      statusId: row.StatusId,
      createdAt: row.CreatedAt,
      updatedAt: row.UpdatedAt,
      toolName: `Tool #${row.ToolId}`,
      toolPrice: 0,
      toolImageUrl: ''
    }));

    return NextResponse.json(rentals);
  } catch (err: any) {
    console.error("/api/rental-bookings GET error:", err?.message || err);
    return NextResponse.json({ 
      error: `Failed to fetch rentals: ${err?.message || err}` 
    }, { status: 500 });
  }
}

// POST /api/rental-bookings - Create new rental booking
export async function POST(request: NextRequest) {
  try {
    const body: RentalCreateRequest = await request.json();
    const {
      toolId,
      ownerId,
      renterId,
      totalPrice,
      rentalDateStart,
      rentalDateEnd,
      statusId = 1, // Default to pending status
      paymentMethodId = 1, // Default to Credit Card
    } = body;

    // Validate required fields
    if (!toolId || !ownerId || !renterId || !totalPrice || !rentalDateStart || !rentalDateEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for date overlaps
    const overlapCheck = await query(`
      SELECT "RentalId" FROM "Rentals" 
      WHERE "ToolId" = $1 
      AND "StatusId" IN (1, 2) 
      AND (
        ($2::date, $3::date) OVERLAPS ("RentalDateStart"::date, "RentalDateEnd"::date)
      )
    `, [toolId, rentalDateStart, rentalDateEnd]);

    if (overlapCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Selected dates overlap with existing rental' 
      }, { status: 400 });
    }

    const insertResult = await query(`
      INSERT INTO "Rentals" (
        "ToolId", 
        "OwnerId", 
        "RenterId", 
        "TotalPrice", 
        "RentalDateStart", 
        "RentalDateEnd", 
        "StatusId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        "RentalId",
        "ToolId", 
        "OwnerId",
        "RenterId",
        "TotalPrice",
        "RentalDateStart",
        "RentalDateEnd",
        "StatusId",
        "CreatedAt",
        "UpdatedAt"
    `, [toolId, ownerId, renterId, totalPrice, rentalDateStart, rentalDateEnd, statusId]);

    const newRental = insertResult.rows[0];
    
    // Create a pending payment for the rental
    try {
      await query(`
        INSERT INTO "RentalsPayments" (
          "Amount", 
          "PaymentStatusId", 
          "PaymentTypeId", 
          "PaymentDate", 
          "RentalId"
        ) VALUES ($1, 1, $2, CURRENT_DATE, $3)
      `, [totalPrice, paymentMethodId, newRental.RentalId]);
      
      console.log('Payment created for rental:', newRental.RentalId);
    } catch (paymentErr: any) {
      console.error('Failed to create payment for rental:', paymentErr?.message || paymentErr);
      // Don't fail the rental creation if payment creation fails
    }

    return NextResponse.json({
      success: true,
      rental: {
        rentalId: newRental.RentalId,
        toolId: newRental.ToolId,
        ownerId: newRental.OwnerId,
        renterId: newRental.RenterId,
        totalPrice: parseFloat(newRental.TotalPrice),
        rentalDateStart: newRental.RentalDateStart,
        rentalDateEnd: newRental.RentalDateEnd,
        statusId: newRental.StatusId,
        createdAt: newRental.CreatedAt,
        updatedAt: newRental.UpdatedAt
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error("/api/rental-bookings POST error:", err?.message || err);
    return NextResponse.json({ error: `Failed to create rental booking: ${err?.message || err}` }, { status: 500 });
  }
}

// PUT /api/rental-bookings - Update rental booking
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { rentalId, rentalDateStart, rentalDateEnd, totalPrice } = body;

    if (!rentalId || !rentalDateStart || !rentalDateEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if rental exists and is pending
    const existingRental = await query(`
      SELECT "StatusId" FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    if (existingRental.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (existingRental.rows[0].StatusId !== 1) {
      return NextResponse.json({ error: 'Only pending rentals can be updated' }, { status: 400 });
    }

    // Check for date overlaps (excluding current rental)
    const overlapCheck = await query(`
      SELECT "RentalId" FROM "Rentals" 
      WHERE "ToolId" = (SELECT "ToolId" FROM "Rentals" WHERE "RentalId" = $1)
      AND "StatusId" IN (1, 2) 
      AND "RentalId" != $1
      AND (
        ($2::date, $3::date) OVERLAPS ("RentalDateStart"::date, "RentalDateEnd"::date)
      )
    `, [rentalId, rentalDateStart, rentalDateEnd]);

    if (overlapCheck.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Selected dates overlap with existing rental' 
      }, { status: 400 });
    }

    await query(`
      UPDATE "Rentals" 
      SET 
        "RentalDateStart" = $1,
        "RentalDateEnd" = $2,
        "TotalPrice" = $3,
        "UpdatedAt" = CURRENT_TIMESTAMP
      WHERE "RentalId" = $4
    `, [rentalDateStart, rentalDateEnd, totalPrice, rentalId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Rental updated successfully' 
    });
  } catch (err: any) {
    console.error("/api/rental-bookings PUT error:", err?.message || err);
    return NextResponse.json({ error: `Failed to update rental: ${err?.message || err}` }, { status: 500 });
  }
}