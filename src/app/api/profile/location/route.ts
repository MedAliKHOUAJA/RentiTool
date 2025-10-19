// src/app/api/profile/location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { locationId } = await request.json();

    if (!locationId) {
      return NextResponse.json({ error: 'LocationId requis' }, { status: 400 });
    }

    // Vérifier que la location existe
    const locationCheck = await db.query(
      `SELECT "LocationId" FROM "Locations" WHERE "LocationId" = $1`,
      [locationId]
    );

    if (locationCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Localisation non trouvée' }, { status: 404 });
    }

    // Mettre à jour la localisation de l'utilisateur
    await db.query(
      `UPDATE "User" SET "LocationId" = $1 WHERE "userId" = $2`,
      [locationId, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Localisation mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur mise à jour localisation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET pour récupérer toutes les localisations disponibles
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET); // Vérifier le token

    const locations = await db.query(
      `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
       FROM "Locations" 
       ORDER BY "Governorate", "Delegation"`
    );

    return NextResponse.json({
      success: true,
      locations: locations.rows
    });

  } catch (error) {
    console.error('Erreur récupération localisations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}