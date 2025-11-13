import { NextRequest, NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { query } from '@/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

// GET pour récupérer toutes les localisations disponibles
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Info utilisateur - CORRECTION: utiliser 'query' importé, pas 'db.query'
    const userResult = await query(
      `SELECT "userId", "FirstName", "Email", "LocationId" FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );
    const user = userResult.rows[0];

    // Recherche optionnelle via query string
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('query'); // Renommer pour éviter le conflit

    let locationsResult;
    if (searchQuery && searchQuery.trim().length > 0) {
      // Recherche par Governorate, Delegation ou Postalcode (ILIKE pour case-insensitive)
      locationsResult = await query(
        `SELECT "LocationId", "Governorate", "Delegation", "Postalcode"
         FROM "Locations"
         WHERE "Governorate" ILIKE '%' || $1 || '%'
            OR "Delegation" ILIKE '%' || $1 || '%'
            OR CAST("Postalcode" AS TEXT) ILIKE '%' || $1 || '%' 
         LIMIT 50`,
        [searchQuery] // Utiliser le nom renommé
      );
    } else {
      // Par défaut, renvoyer quelques entrées pour amorcer l'UI (limite 50)
      locationsResult = await query(
        `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
         FROM "Locations" 
         ORDER BY "Governorate" ASC, "Delegation" ASC 
         LIMIT 50`
      );
    }

    // Location actuelle de l'utilisateur
    let currentLocation = null;
    if (user.LocationId) {
      const locationResult = await query(
        `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
         FROM "Locations" WHERE "LocationId" = $1`,
        [user.LocationId]
      );
      currentLocation = locationResult.rows[0] || null;
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        name: user.FirstName,
        email: user.Email,
        locationId: user.LocationId
      },
      currentLocation,
      locations: locationsResult.rows
    });

  } catch (error) {
    console.error('Debug location error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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
    const locationCheck = await query(
      `SELECT "LocationId" FROM "Locations" WHERE "LocationId" = $1`,
      [locationId]
    );

    if (locationCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Localisation non trouvée' }, { status: 404 });
    }

    // Mettre à jour la localisation de l'utilisateur
    await query(
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