import { NextResponse } from "next/server";
import { query } from "@/db";

// Fonction pour générer et logger un message automatique (non-bloquant)
async function generateAutoMessage(rentalId: number, messageType: 'acceptance' | 'rejection') {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/generate-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rentalId,
        messageType,
        language: 'fr'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Message ${messageType} généré pour la réservation #${rentalId}:`, data.message);
      // Ici vous pouvez ajouter l'envoi par email, SMS, notification, etc.
      return data.message;
    } else {
      console.warn(`⚠️ Impossible de générer le message pour la réservation #${rentalId}`);
    }
  } catch (error) {
    // Ne pas bloquer le processus si la génération de message échoue
    console.warn(`⚠️ Erreur lors de la génération du message pour la réservation #${rentalId}:`, error);
  }
  return null;
}

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
    
    // Générer automatiquement un message personnalisé (non-bloquant)
    const messageType = action === 'accept' ? 'acceptance' : 'rejection';
    generateAutoMessage(rentalId, messageType).catch(err => {
      console.warn('Message generation failed (non-critical):', err);
    });
    
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
