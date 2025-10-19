import { NextResponse } from "next/server";
import { query } from "@/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rentalId, action } = body; // action: 'accept' ou 'reject'
    
    if (!rentalId || !action) {
      return NextResponse.json({ error: 'Missing rentalId or action' }, { status: 400 });
    }
    
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "accept" or "reject"' }, { status: 400 });
    }
    
    // Vérifier si la réservation existe
    const checkResult = await query(`
      SELECT "RentalId", "ToolId", "StatusId" FROM "Rentals" WHERE "RentalId" = $1
    `, [rentalId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Rental request not found' }, { status: 404 });
    }
    
    const rental = checkResult.rows[0];
    
    // Déterminer le nouveau statut
    const newStatusId = action === 'accept' ? 2 : 3; // 2 = Accepté, 3 = Rejeté
    const toolStatusId = action === 'accept' ? 2 : 1; // 2 = Réservé, 1 = Disponible
    
    // Mettre à jour le statut de la réservation
    await query(`
      UPDATE "Rentals" 
      SET "StatusId" = $1
      WHERE "RentalId" = $2
    `, [newStatusId, rentalId]);
    
    // Mettre à jour le statut de l'outil
    try {
      await query(`
        UPDATE "Tools" 
        SET "StatusId" = $1
        WHERE "ToolId" = $2
      `, [toolStatusId, rental.ToolId]);
    } catch (toolError) {
      console.log('Tool update failed, but rental request was updated:', toolError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Rental request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
      rentalId,
      newStatusId,
      toolStatusId
    });
    
  } catch (err: any) {
    console.error("Rental request action error:", err);
    return NextResponse.json({ 
      error: err?.message || 'Database error'
    }, { status: 500 });
  }
}
