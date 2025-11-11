// src/app/api/profile/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';
import { saveProfileImage, deleteProfileImage } from '@/lib/upload';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Récupérer le fichier depuis FormData
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }

    console.log(`📸 Traitement image profil pour l'utilisateur ${decoded.userId}`);
    
    // Sauvegarder l'image
    const uploadResult = await saveProfileImage(file, decoded.userId);
    
    if (!uploadResult.success) {
      return NextResponse.json({ 
        error: uploadResult.error || 'Erreur lors de la sauvegarde de l\'image' 
      }, { status: 400 });
    }

    // Mettre à jour la base de données avec le chemin de l'image
    try {
      await db.query(
        `UPDATE "User" SET "ProfileImage" = $1 WHERE "userId" = $2`,
        [uploadResult.url, decoded.userId]
      );
      console.log('✅ Image sauvegardée en base de données');
    } catch (dbError) {
      console.warn('⚠️ Impossible de sauvegarder en BD, mais image stockée localement');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      imageUrl: uploadResult.url
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde image:', error);
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
    
    // Récupérer l'image de profil depuis la base de données
    const result = await db.query(
      `SELECT "ProfileImage" FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );
    
    const profileImage = result.rows[0]?.ProfileImage;
    
    return NextResponse.json({ 
      success: true,
      image: profileImage || null
    });

  } catch (error) {
    console.error('❌ Erreur récupération image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Récupérer l'URL actuelle de l'image
    const result = await db.query(
      `SELECT "ProfileImage" FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );

    const currentImage = result.rows[0]?.ProfileImage as string | null;

    if (!currentImage) {
      // Rien à supprimer, mais on considère l'opération réussie
      return NextResponse.json({ success: true, message: 'Aucune image à supprimer' });
    }

    // Supprimer côté stockage (noop pour data URLs)
    const deleted = await deleteProfileImage(currentImage);

    if (!deleted) {
      return NextResponse.json({ error: 'Suppression de l\'image échouée' }, { status: 500 });
    }

    // Mettre à jour la BD pour retirer la référence
    await db.query(
      `UPDATE "User" SET "ProfileImage" = NULL WHERE "userId" = $1`,
      [decoded.userId]
    );

    return NextResponse.json({ success: true, message: 'Image supprimée' });

  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}