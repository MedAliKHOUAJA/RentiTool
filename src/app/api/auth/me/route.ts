// src/app/api/auth/me/route.ts
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
    
    console.log('🔄 Récupération des données utilisateur pour userId:', decoded.userId);
    
    const result = await db.query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Phone", "RoleId", "LocationId" 
       FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = result.rows[0];
    
    // Récupérer la localisation
    let locationInfo = null;
    if (user.LocationId) {
      try {
        const locationResult = await db.query(
          `SELECT "Governorate", "Delegation", "Postalcode" FROM "Locations" WHERE "LocationId" = $1`,
          [user.LocationId]
        );
        
        if (locationResult.rows.length > 0) {
          const location = locationResult.rows[0];
          locationInfo = {
            governorate: location.Governorate,
            delegation: location.Delegation,
            postalCode: location.Postalcode
          };
        }
      } catch (error) {
        console.warn('⚠️ Erreur récupération localisation:', error);
      }
    }

    const userData = {
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

    console.log('✅ Données utilisateur retournées:', userData);
    
    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('💥 Erreur API /auth/me:', error);
    return NextResponse.json({ error: 'Token invalide ou erreur serveur' }, { status: 401 });
  }
}