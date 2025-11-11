import { NextRequest, NextResponse } from 'next/server';
import { saveProfileImage } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('image') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Test avec un userId fictif
    const result = await saveProfileImage(file, 'test-user-123');
    
    if (result.success) {
      return NextResponse.json({
        message: 'Image uploadée avec succès',
        fileName: result.fileName,
        url: result.url,
        base64Length: result.base64?.length || 0
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'upload' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Erreur upload test:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  }
}