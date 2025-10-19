// src/app/api/profile/route.ts
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
    
    console.log('🔄 Récupération du profil pour userId:', decoded.userId);
    
    // Récupérer les informations de base de l'utilisateur
    const result = await db.query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Phone", "RoleId", "LocationId" 
       FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = result.rows[0];
    
    console.log('📍 LocationId de l\'utilisateur:', user.LocationId);
    
    // Récupérer les informations de localisation
    let locationInfo = null;
    if (user.LocationId) {
      try {
        const locationResult = await db.query(
          `SELECT "LocationId", "Governorate", "Delegation", "Postalcode" 
           FROM "Locations" WHERE "LocationId" = $1`,
          [user.LocationId]
        );

        console.log('📍 Résultat de la requête location:', locationResult.rows);

        if (locationResult.rows.length > 0) {
          const location = locationResult.rows[0];
          locationInfo = {
            locationId: location.LocationId,
            governorate: location.Governorate,
            delegation: location.Delegation,
            postalCode: location.Postalcode
          };
          console.log('📍 Informations de localisation trouvées:', locationInfo);
        } else {
          console.log('❌ Aucune localisation trouvée pour LocationId:', user.LocationId);
        }
      } catch (locationError) {
        console.error('💥 Erreur récupération localisation:', locationError);
      }
    } else {
      console.log('❌ Aucun LocationId associé à l\'utilisateur');
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

    console.log('✅ Profil retourné:', userProfile);
    
    return NextResponse.json(userProfile);

  } catch (error) {
    console.error('💥 Erreur API profile:', error);
    return NextResponse.json({ error: 'Token invalide ou erreur serveur' }, { status: 401 });
  }
}