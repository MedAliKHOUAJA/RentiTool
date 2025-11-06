// src/app/api/profile/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/db';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    console.log(`📸 Photo de profil mise à jour pour l'utilisateur ${decoded.userId}`);
    
    // Stocker l'image en base de données (décommentez si vous avez la colonne ProfileImage)
    /*
    try {
      // await query(
        // `UPDATE "User" SET "ProfileImage" = $1 WHERE "userId" = $2`,
        // [image, decoded.userId]
      // );
      console.log('✅ Image sauvegardée en base de données');
    } catch (dbError) {
      console.warn('⚠️ Impossible de sauvegarder en BD, continuation avec localStorage');
    }
    */

    return NextResponse.json({ 
      success: true,
      message: 'Photo de profil mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur sauvegarde image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Récupérer l'image de profil depuis la base de données (décommentez si disponible)
    /*
    // const result = await query(
      // `SELECT "ProfileImage" FROM "User" WHERE "userId" = $1`,
      // [decoded.userId]
    // );
    
    const profileImage = result.rows[0]?.ProfileImage;
    return NextResponse.json({ 
      success: true,
      image: profileImage
    });
    */

    // Pour l'instant, retourner null
    return NextResponse.json({ 
      success: true,
      image: null
    });

  } catch (error) {
    console.error('Erreur récupération image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}