import { NextRequest, NextResponse } from 'next/server';
import { generateRentalMessage, RentalMessageContext } from '@/lib/gemini';
import { query } from '@/db';

// POST /api/ai/generate-message - Générer un message personnalisé
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      rentalId,
      messageType,
      language = 'fr',
      recipient = 'renter' // 'renter' ou 'owner'
    } = body;

    // Validation
    if (!rentalId || !messageType) {
      return NextResponse.json(
        { error: 'Missing required fields: rentalId and messageType' },
        { status: 400 }
      );
    }

    const validMessageTypes = ['confirmation', 'reminder', 'acceptance', 'rejection', 'completion', 'cancellation'];
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `Invalid messageType. Must be one of: ${validMessageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Récupérer les informations de la réservation depuis la base de données
    // On récupère d'abord les données de base de la réservation
    const rentalResult = await query(`
      SELECT 
        r."RentalId",
        r."ToolId",
        r."OwnerId",
        r."RenterId",
        r."TotalPrice",
        r."RentalDateStart",
        r."RentalDateEnd",
        r."StatusId"
      FROM "Rentals" r
      WHERE r."RentalId" = $1
    `, [rentalId]);

    if (rentalResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    const rental = rentalResult.rows[0];

    // Mapper le statusId au texte
    const statusMap: Record<number, string> = {
      1: 'En attente',
      2: 'Confirmé',
      3: 'Terminé',
      4: 'Annulé',
      5: 'Rejeté'
    };

    // Si ToolName n'existe pas, utiliser un nom par défaut basé sur l'ID
    const toolName = rental.ToolName || `Outil #${rental.ToolId}`;

    // Construire le contexte pour Gemini
    const context: RentalMessageContext = {
      rentalId: rental.RentalId,
      toolId: rental.ToolId,
      toolName: toolName,
      ownerId: rental.OwnerId,
      renterId: rental.RenterId,
      totalPrice: parseFloat(rental.TotalPrice),
      rentalDateStart: rental.RentalDateStart,
      rentalDateEnd: rental.RentalDateEnd,
      statusId: rental.StatusId,
      statusText: statusMap[rental.StatusId] || 'Inconnu',
      messageType: messageType as RentalMessageContext['messageType'],
      language: language as 'fr' | 'en' | 'ar'
    };

    // Générer le message avec Gemini
    const message = await generateRentalMessage(context);

    return NextResponse.json({
      success: true,
      message,
      context: {
        rentalId: context.rentalId,
        messageType: context.messageType,
        language: context.language,
        recipient
      }
    });

  } catch (error: any) {
    console.error('/api/ai/generate-message error:', error);
    
    // Si l'erreur est liée à la clé API manquante, retourner un message d'erreur clair
    if (error.message?.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY is not configured. Please add it to your .env.local file.',
          hint: 'Get your free API key from https://makersuite.google.com/app/apikey'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Failed to generate message: ${error?.message || error}` },
      { status: 500 }
    );
  }
}

// GET /api/ai/generate-message - Documentation
export async function GET() {
  return NextResponse.json({
    description: 'API pour générer des messages personnalisés avec Gemini AI',
    usage: {
      method: 'POST',
      endpoint: '/api/ai/generate-message',
      body: {
        rentalId: 'number (required) - ID de la réservation',
        messageType: 'string (required) - Type de message: confirmation, acceptance, rejection, reminder, completion, cancellation',
        language: 'string (optional) - Langue: fr, en, ar (défaut: fr)',
        recipient: 'string (optional) - Destinataire: renter, owner (défaut: renter)'
      }
    },
    examples: {
      confirmation: {
        rentalId: 1,
        messageType: 'confirmation',
        language: 'fr'
      },
      acceptance: {
        rentalId: 1,
        messageType: 'acceptance',
        language: 'fr'
      }
    }
  });
}

