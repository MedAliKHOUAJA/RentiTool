import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { SetPrimaryImageUseCase } from '@/features/tools/application/use-cases/set-primary-image.use-case';
import { DeleteToolImageUseCase } from '@/features/tools/application/use-cases/delete-tool-images.use-case';


/**
 * PUT - Définir une image comme primaire
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    console.log('⭐ [API] PUT /api/tools/[id]/images/[imageId]');
    console.log('⭐ [API] toolId:', params.id, 'imageId:', params.imageId);

    const userId = getUserIdFromToken(request);

    if (!userId) {
      console.error('❌ [API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: toolId, imageId } = params;

    // Vérifier la propriété de l'outil
    const toolRepository = new PostgresToolRepository();
    const tool = await toolRepository.findById(toolId);

    if (!tool) {
      console.error('❌ [API] Tool not found');
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    console.log('✅ [API] Tool trouvé, owner:', tool.owner.userId);

    // Use case
    const setPrimaryImageUseCase = new SetPrimaryImageUseCase(toolRepository);

    await setPrimaryImageUseCase.execute({
      imageId,
      toolId,
      userId,
      ownerId: tool.owner.userId,
    });

    console.log('✅ [API] Image définie comme primaire');
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('❌ [API] Error setting primary image:', error);
    const status = error.message === 'You do not own this tool' ? 403 
                 : error.message === 'Image not found' ? 404 
                 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to set primary image' },
      { status }
    );
  }
}

/**
 * DELETE - Supprimer une image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    console.log('🗑️ [API] DELETE /api/tools/[id]/images/[imageId]');
    console.log('🗑️ [API] toolId:', params.id, 'imageId:', params.imageId);

    const userId = getUserIdFromToken(request);

    if (!userId) {
      console.error('❌ [API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: toolId, imageId } = params;

    // Vérifier la propriété de l'outil
    const toolRepository = new PostgresToolRepository();
    const tool = await toolRepository.findById(toolId);

    if (!tool) {
      console.error('❌ [API] Tool not found');
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    console.log('✅ [API] Tool trouvé, owner:', tool.owner.userId);

    // Use case
    const deleteImageUseCase = new DeleteToolImageUseCase(toolRepository);

    await deleteImageUseCase.execute({
      imageId,
      toolId,
      userId,
      ownerId: tool.owner.userId,
    });

    console.log('✅ [API] Image supprimée');
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('❌ [API] Error deleting image:', error);
    const status = error.message === 'You do not own this tool' ? 403 
                 : error.message === 'Image not found' ? 404 
                 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status }
    );
  }
}