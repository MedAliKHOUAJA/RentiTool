// src/app/api/profile/location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Info utilisateur
    const userResult = await db.query(
      `SELECT "userId", "FirstName", "Email", "LocationId" FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );
    const user = userResult.rows[0];

    // Recherche optionnelle via query string
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let locationsResult;
    if (query && query.trim().length > 0) {
      // Recherche par Governorate, Delegation ou Postalcode (ILIKE pour case-insensitive)
      locationsResult = await db.query(
        `SELECT "LocationId", "Governorate", "Delegation", "Postalcode"
         FROM "Locations"
         WHERE "Governorate" ILIKE '%' || $1 || '%'
            OR "Delegation" ILIKE '%' || $1 || '%'
            OR CAST("Postalcode" AS TEXT) ILIKE '%' || $1 || '%' 
         LIMIT 50`,
        [query]
      );
    } else {
      // Par défaut, renvoyer quelques entrées pour amorcer l'UI (limite 50)
      locationsResult = await db.query(
        `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
         FROM "Locations" 
         ORDER BY "Governorate" ASC, "Delegation" ASC 
         LIMIT 50`
      );
    }

    // Location actuelle de l'utilisateur
    let currentLocation = null;
    if (user.LocationId) {
      const locationResult = await db.query(
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
    const body = await request.json();
    const { locationId } = body || {};

    if (!locationId || isNaN(Number(locationId))) {
      return NextResponse.json({ error: 'locationId invalide' }, { status: 400 });
    }

    // Vérifier que la localisation existe
    const locationCheck = await db.query(
      `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" FROM "Locations" WHERE "LocationId" = $1`,
      [locationId]
    );
    if (locationCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Localisation introuvable' }, { status: 404 });
    }

    // Mettre à jour l'utilisateur
    const updateResult = await db.query(
      `UPDATE "User" SET "LocationId" = $1 WHERE "userId" = $2 RETURNING "userId", "LocationId"`,
      [locationId, decoded.userId]
    );

    const updatedUser = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      user: updatedUser,
      location: locationCheck.rows[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour localisation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}