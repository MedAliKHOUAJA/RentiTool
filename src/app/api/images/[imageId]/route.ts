import { NextRequest, NextResponse } from 'next/server';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { GetImageBinaryUseCase } from '@/features/tools/application/use-cases/get-image-binary.use.case';

export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer une image par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }  // ✅ Utiliser imageId car le dossier s'appelle [imageId]
) {
  try {
    console.log('🖼️ [API Images] Début GET /api/images/[imageId]');
    console.log('🖼️ [API Images] imageId:', params.imageId);  // ✅ Utiliser params.imageId

    const imageId = params.imageId;  // ✅ Récupérer depuis params.imageId

    if (!imageId) {
      console.error('❌ [API Images] imageId manquant');
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Use case
    const toolRepository = new PostgresToolRepository();
    const getImageBinaryUseCase = new GetImageBinaryUseCase(toolRepository);

    console.log('🖼️ [API Images] Récupération de l\'image...');
    const buffer = await getImageBinaryUseCase.execute(imageId);

    if (!buffer) {
      console.error('❌ [API Images] Image non trouvée pour ID:', imageId);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    console.log('✅ [API Images] Image trouvée, taille:', buffer.length, 'bytes');

    // Déterminer le type MIME à partir des premiers octets (magic bytes)
    let contentType = 'image/jpeg';
    
    if (buffer.length >= 2) {
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        contentType = 'image/png';
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
        contentType = 'image/gif';
      } else if (buffer[0] === 0x52 && buffer[1] === 0x49) {
        contentType = 'image/webp';
      } else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        contentType = 'image/jpeg';
      }
    }

    console.log('✅ [API Images] Content-Type:', contentType);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('❌ [API Images] Erreur complète:', error);
    console.error('❌ [API Images] Stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to serve image', details: error.message },
      { status: 500 }
    );
  }
}