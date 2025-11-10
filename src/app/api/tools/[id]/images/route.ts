import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { GetToolImagesUseCase } from '@/features/tools/application/use-cases/get-tool-images.use-case';
import { UploadToolImageUseCase } from '@/features/tools/application/use-cases/upload-tool-image.use-case';


export const dynamic = 'force-dynamic';

/**
 * GET - Récupérer toutes les images d'un outil
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;

    const toolRepository = new PostgresToolRepository();
    const getToolImagesUseCase = new GetToolImagesUseCase(toolRepository);

    const images = await getToolImagesUseCase.execute(toolId);

    return NextResponse.json({ images });

  } catch (error: any) {
    console.error('❌ Error fetching tool images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajouter une nouvelle image à un outil
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const toolId = params.id;

    // Vérifier la propriété de l'outil
    const toolRepository = new PostgresToolRepository();
    const tool = await toolRepository.findById(toolId);

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Récupérer le fichier
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Valider le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Valider la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convertir en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use case
    const uploadImageUseCase = new UploadToolImageUseCase(toolRepository);

    const newImage = await uploadImageUseCase.execute({
      file: buffer,
      toolId,
      userId,
      ownerId: tool.owner.userId,
    });

    return NextResponse.json({
      success: true,
      image: newImage,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: error.message === 'You do not own this tool' ? 403 : 500 }
    );
  }
}