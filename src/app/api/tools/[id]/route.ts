import { NextRequest, NextResponse } from 'next/server';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔵 [API] === DÉBUT GET /api/tools/[id] ===');
  console.log('🔵 [API] params.id:', params.id);
  
  try {
    const toolId = params.id;
    const repository = new PostgresToolRepository();
    const tool = await repository.findById(toolId);

    if (!tool) {
      console.log('🔴 [API] Tool non trouvé');
      return NextResponse.json(
        { success: false, notFound: true, error: 'Tool not found' },
        { status: 404 }
      );
    }

    console.log('🔵 [API] Tool trouvé, nettoyage des images...');

    // ✅ FONCTION pour nettoyer un objet Image (retirer imageBinary)
    const cleanImage = (img: any) => {
      if (!img) return undefined;
      return {
        imageId: img.imageId,
        isPrimaryToolImage: img.isPrimaryToolImage,
        classificationId: img.classificationId,
        toolId: img.toolId,
        userId: img.userId,
        businessCardId: img.businessCardId,
        ratingId: img.ratingId,
        // ⚠️ PAS de imageBinary
      };
    };

    // ✅ Construire un objet propre sans AUCUN Buffer
    const cleanTool = {
      // Propriétés de base
      toolId: tool.toolId,
      title: tool.title,
      description: tool.description,
      categoryId: tool.categoryId,
      subCategoryId: tool.subCategoryId,
      brand: tool.brand,
      model: tool.model,
      rentalPricePerDay: tool.rentalPricePerDay,
      rentalPricePerWeek: tool.rentalPricePerWeek,
      isActive: tool.isActive,
      statusId: tool.statusId,
      href: tool.href,
      
      // Owner
      owner: {
        userId: tool.owner.userId,
        firstName: tool.owner.firstName,
        lastName: tool.owner.lastName,
        email: tool.owner.email,
        phone: tool.owner.phone,
        roleId: tool.owner.roleId,
        locationId: tool.owner.locationId,
        locationName: tool.owner.locationName,
        starRating: tool.owner.starRating,
      },
      
      // ✅ Nettoyer TOUTES les propriétés d'images
      image: cleanImage(tool.image),
      images: tool.images?.map(cleanImage),
      imagePrimary: cleanImage(tool.imagePrimary),
      
      // Reviews (vérifier qu'il n'y a pas d'images dedans)
      toolReviews: tool.toolReviews?.map(review => ({
        ...review,
        // Si les reviews ont des images, les nettoyer aussi
      })),
      ownerReviews: tool.ownerReviews?.map(review => ({
        ...review,
        // Si les reviews ont des images, les nettoyer aussi
      })),
    };

    console.log('🔵 [API] Nettoyage terminé');
    console.log('🔵 [API] images:', cleanTool.images?.length || 0);
    console.log('🔵 [API] imagePrimary:', cleanTool.imagePrimary ? 'existe' : 'null');
    console.log('🔵 [API] image:', cleanTool.image ? 'existe' : 'null');

    return NextResponse.json(cleanTool);
    
  } catch (error) {
    console.error('🔴 [API] Erreur:', error);
    console.error('🔴 [API] Stack:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tool details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const repository = new PostgresToolRepository();
    const deleted = await repository.delete(toolId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, notFound: true, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    const body = await request.json();

    const repository = new PostgresToolRepository();
    const tool = await repository.update(toolId, body);

    const cleanTool = {
      ...tool,
      image: tool.image ? {
        imageId: tool.image.imageId,
        isPrimaryToolImage: tool.image.isPrimaryToolImage,
        classificationId: tool.image.classificationId,
        toolId: tool.image.toolId,
        userId: tool.image.userId,
        businessCardId: tool.image.businessCardId,
        ratingId: tool.image.ratingId,
      } : undefined,
    };

    return NextResponse.json({ success: true, tool: cleanTool });
  } catch (error) {
    console.error('Error updating tool:', error);
    
    if (error instanceof Error && error.message === 'Tool not found') {
      return NextResponse.json(
        { success: false, error: 'Tool not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}