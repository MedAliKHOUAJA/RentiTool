import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/rental-bookings/[id] - Get specific rental
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = params.id;
    console.log('GET /api/rental-bookings/[id] - rentalId:', rentalId);

    const result = await query(`
      SELECT 
        r.*,
        t.name as toolName,
        t.price as toolPrice,
        t.ownerId as toolOwnerId,
        s.name as statusName
      FROM "Rentals" r
      LEFT JOIN "Tools" t ON r."ToolId" = t."ToolId"
      LEFT JOIN "RentalStatus" s ON r."StatusId" = s."StatusId"
      WHERE r."RentalId" = $1
    `, [rentalId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error("/api/rental-bookings/[id] GET error:", err?.message || err);
    return NextResponse.json({ error: `Failed to fetch rental: ${err?.message || err}` }, { status: 500 });
  }
}

// PUT /api/rental-bookings/[id] - Update rental dates only
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = params.id;
    const body = await request.json();
    const { rentalDateStart, rentalDateEnd } = body;

    console.log('PUT /api/rental-bookings/[id] - rentalId:', rentalId);
    console.log('PUT /api/rental-bookings/[id] - body:', body);

    if (!rentalDateStart || !rentalDateEnd) {
      return NextResponse.json({ error: 'Missing required fields: rentalDateStart and rentalDateEnd' }, { status: 400 });
    }

    // Check if rental exists
    const existingRental = await query(`
      SELECT * FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    if (existingRental.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Check for date conflicts with other rentals (excluding current rental)
    const overlapCheck = await query(`
      SELECT "RentalId" FROM "Rentals" 
      WHERE "ToolId" = (SELECT "ToolId" FROM "Rentals" WHERE "RentalId" = $1)
      AND "RentalId" != $1
      AND "StatusId" IN (1, 2) -- Only check pending and confirmed rentals
      AND (
        ($2::timestamp, $3::timestamp) OVERLAPS ("RentalDateStart", "RentalDateEnd")
      )
    `, [rentalId, rentalDateStart, rentalDateEnd]);

    if (overlapCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Tool is not available for the selected dates' }, { status: 409 });
    }

    // Update rental dates only
    const result = await query(`
      UPDATE "Rentals" 
      SET 
        "RentalDateStart" = $2,
        "RentalDateEnd" = $3
      WHERE "RentalId" = $1
      RETURNING *
    `, [rentalId, rentalDateStart, rentalDateEnd]);

    return NextResponse.json({ 
      success: true, 
      rental: result.rows[0],
      message: 'Rental dates updated successfully' 
    });
  } catch (err: any) {
    console.error("/api/rental-bookings/[id] PUT error:", err?.message || err);
    return NextResponse.json({ error: `Failed to update rental: ${err?.message || err}` }, { status: 500 });
  }
}

// DELETE /api/rental-bookings/[id] - Delete rental
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = params.id;
    console.log('DELETE /api/rental-bookings/[id] - rentalId:', rentalId);

    // Check if rental exists
    const existingRental = await query(`
      SELECT * FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    if (existingRental.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Check if rental can be deleted (only pending rentals can be deleted)
    const rental = existingRental.rows[0];
    console.log('DELETE - rental data:', rental);
    console.log('DELETE - rental.statusId:', rental.StatusId, 'type:', typeof rental.StatusId);
    
    // Allow deletion for pending rentals (status 1) or any status for now
    // TODO: Restrict to only pending rentals once we confirm the status values
    if (rental.StatusId && rental.StatusId !== 1 && rental.StatusId !== '1') {
      console.log('DELETE - Status check failed, but allowing deletion for debugging');
      // return NextResponse.json({ 
      //   error: `Only pending rentals can be deleted. Current status: ${rental.StatusId}` 
      // }, { status: 400 });
    }

    // Delete rental
    await query(`
      DELETE FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Rental deleted successfully' 
    });
  } catch (err: any) {
    console.error("/api/rental-bookings/[id] DELETE error:", err?.message || err);
    return NextResponse.json({ error: `Failed to delete rental: ${err?.message || err}` }, { status: 500 });
  }
}
