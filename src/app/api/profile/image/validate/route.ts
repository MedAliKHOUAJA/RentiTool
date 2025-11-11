import { NextRequest, NextResponse } from 'next/server';
import { validateImageFile } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, fileType } = await request.json();
    
    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Créer un objet File simulé pour la validation
    const mockFile = new File([''], fileName, { type: fileType });
    Object.defineProperty(mockFile, 'size', { value: fileSize });

    const validation = validateImageFile(mockFile);
    
    return NextResponse.json({
      valid: validation.valid,
      error: validation.error,
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      fileType
    });

  } catch (error) {
    console.error('❌ Erreur validation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}