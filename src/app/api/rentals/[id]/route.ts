import { NextResponse } from "next/server";
import { query } from "@/db";
import { RentalDataType, RentalUpdateRequest } from "@/data/types";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = Number(params.id);
    
    if (isNaN(rentalId)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    const result = await query(`
      SELECT 
        "RentalId",
        "ToolId", 
        "OwnerId",
        "RenterId",
        "TotalPrice",
        "RentalDateStart",
        "RentalDateEnd",
        "StatusId",
        -- "CreatedAt", -- Colonne n'existe pas
        -- "UpdatedAt" -- Colonne n'existe pas
      FROM "Rentals"
      WHERE "RentalId" = $1
    `, [rentalId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const rental: RentalDataType = {
      rentalId: row.RentalId,
      toolId: row.ToolId,
      ownerId: row.OwnerId,
      renterId: row.RenterId,
      totalPrice: row.TotalPrice,
      rentalDateStart: row.RentalDateStart,
      rentalDateEnd: row.RentalDateEnd,
      statusId: row.StatusId,
      // createdAt: row.CreatedAt, // Colonne n'existe pas
      // updatedAt: row.UpdatedAt, // Colonne n'existe pas
    };

    return NextResponse.json(rental);
  } catch (err: any) {
    console.error(`/api/rentals/${params.id} GET error:`, err?.message || err);
    return NextResponse.json({ error: `Failed to fetch rental: ${err?.message || err}` }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = Number(params.id);
    
    if (isNaN(rentalId)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    const body: RentalUpdateRequest = await request.json();
    const { totalPrice, rentalDateStart, rentalDateEnd, statusId } = body;

    // Check if rental exists
    const existingResult = await query(`
      SELECT "RentalId", "ToolId", "RentalDateStart", "RentalDateEnd", "StatusId"
      FROM "Rentals" 
      WHERE "RentalId" = $1
    `, [rentalId]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const existing = existingResult.rows[0];

    // If updating dates, check for overlaps (excluding current rental)
    if (rentalDateStart || rentalDateEnd) {
      const startDate = rentalDateStart ? new Date(rentalDateStart) : new Date(existing.RentalDateStart);
      const endDate = rentalDateEnd ? new Date(rentalDateEnd) : new Date(existing.RentalDateEnd);
      
      if (startDate >= endDate) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
      }

      if (startDate < new Date()) {
        return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
      }

      // Check for overlapping rentals (excluding current rental)
      const overlapCheck = await query(`
        SELECT "RentalId" FROM "Rentals" 
        WHERE "ToolId" = $1 
        AND "RentalId" != $2
        AND "StatusId" IN (1, 2) -- Pending or Confirmed status
        AND (
          ("RentalDateStart" <= $3 AND "RentalDateEnd" > $3) OR
          ("RentalDateStart" < $4 AND "RentalDateEnd" >= $4) OR
          ("RentalDateStart" >= $3 AND "RentalDateEnd" <= $4)
        )
      `, [existing.ToolId, rentalId, rentalDateStart || existing.RentalDateStart, rentalDateEnd || existing.RentalDateEnd]);

      if (overlapCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Tool is not available for the selected dates' }, { status: 409 });
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (totalPrice !== undefined) {
      updateFields.push(`"TotalPrice" = $${paramIndex}`);
      values.push(totalPrice);
      paramIndex++;
    }

    if (rentalDateStart !== undefined) {
      updateFields.push(`"RentalDateStart" = $${paramIndex}`);
      values.push(rentalDateStart);
      paramIndex++;
    }

    if (rentalDateEnd !== undefined) {
      updateFields.push(`"RentalDateEnd" = $${paramIndex}`);
      values.push(rentalDateEnd);
      paramIndex++;
    }

    if (statusId !== undefined) {
      updateFields.push(`"StatusId" = $${paramIndex}`);
      values.push(statusId);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Add updated timestamp
    // updateFields.push(`"UpdatedAt" = NOW()`); // Colonne n'existe pas
    
    // Add rental ID as last parameter
    values.push(rentalId);

    const sql = `
      UPDATE "Rentals" 
      SET ${updateFields.join(', ')}
      WHERE "RentalId" = $${paramIndex}
      RETURNING 
        "RentalId",
        "ToolId", 
        "OwnerId",
        "RenterId",
        "TotalPrice",
        "RentalDateStart",
        "RentalDateEnd",
        "StatusId",
        -- "CreatedAt", -- Colonne n'existe pas
        -- "UpdatedAt" -- Colonne n'existe pas
    `;

    const result = await query(sql, values);
    const row = result.rows[0];
    
    const rental: RentalDataType = {
      rentalId: row.RentalId,
      toolId: row.ToolId,
      ownerId: row.OwnerId,
      renterId: row.RenterId,
      totalPrice: row.TotalPrice,
      rentalDateStart: row.RentalDateStart,
      rentalDateEnd: row.RentalDateEnd,
      statusId: row.StatusId,
      // createdAt: row.CreatedAt, // Colonne n'existe pas
      // updatedAt: row.UpdatedAt, // Colonne n'existe pas
    };

    return NextResponse.json(rental);
  } catch (err: any) {
    console.error(`/api/rentals/${params.id} PUT error:`, err?.message || err);
    return NextResponse.json({ error: `Failed to update rental: ${err?.message || err}` }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rentalId = Number(params.id);
    
    if (isNaN(rentalId)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    // Check if rental exists
    const existingResult = await query(`
      SELECT "RentalId", "StatusId" FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);

    if (existingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const existing = existingResult.rows[0];

    // Check if rental can be deleted (not confirmed or completed)
    if (existing.StatusId === 2 || existing.StatusId === 3) {
      return NextResponse.json({ error: 'Cannot delete confirmed or completed rentals' }, { status: 400 });
    }

    // Delete the rental
    await query(`DELETE FROM "Rentals" WHERE "RentalId" = $1`, [rentalId]);

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error(`/api/rentals/${params.id} DELETE error:`, err?.message || err);
    return NextResponse.json({ error: `Failed to delete rental: ${err?.message || err}` }, { status: 500 });
  }
}
