import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/db';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

// Ajoutons le support des méthodes
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    console.log('🔍 DEBUG: Récupération profil pour userId:', decoded.userId);
    
    // Récupérer les informations de base de l'utilisateur
    const result = await query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Phone", "RoleId", "LocationId" 
       FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = result.rows[0];
    
    console.log('📍 DEBUG: LocationId de l\'utilisateur:', user.LocationId);
    
    // Récupérer la localisation
    let locationInfo = null;
    if (user.LocationId) {
      try {
        const locationResult = await query(
          `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
           FROM "Locations" WHERE "LocationId" = $1`,
          [user.LocationId]
        );

        console.log('📍 DEBUG: Résultat location:', {
          rowCount: locationResult.rowCount,
          rows: locationResult.rows
        });

        if (locationResult.rows.length > 0) {
          const location = locationResult.rows[0];
          locationInfo = {
            governorate: location.Governorate,
            delegation: location.Delegation,
            postalCode: location.Postalcode
          };
        }
      } catch (locationError) {
        console.error('💥 Erreur récupération localisation:', locationError);
      }
    }

    const userProfile = {
      userId: user.userId,
      firstName: user.FirstName,
      lastName: user.LastName,
      email: user.Email,
      phone: user.Phone,
      roleId: user.RoleId,
      locationId: user.LocationId,
      governorate: locationInfo?.governorate || null,
      delegation: locationInfo?.delegation || null,
      postalCode: locationInfo?.postalCode || null
    };

    console.log('🎯 DEBUG: Profil final:', userProfile);
    
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('💥 Erreur API profile:', error);
    return NextResponse.json({ error: 'Token invalide ou erreur serveur' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { firstName, lastName, email, phone } = await request.json();

    console.log('🔄 PUT Profile: Mise à jour pour', decoded.userId, { firstName, lastName, email, phone });

    // Validation basique
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const result = await query(
      `UPDATE "User" 
       SET "FirstName" = $1, "LastName" = $2, "Email" = $3, "Phone" = $4
       WHERE "userId" = $5
       RETURNING "userId", "FirstName", "LastName", "Email", "Phone", "RoleId", "LocationId"`,
      [firstName, lastName, email, phone, decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = result.rows[0];

    console.log('✅ PUT Profile: Mis à jour avec succès');

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
        phone: user.Phone,
        roleId: user.RoleId,
        locationId: user.LocationId
      }
    });

  } catch (error) {
    console.error('💥 Erreur mise à jour profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Gérer les autres méthodes
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}