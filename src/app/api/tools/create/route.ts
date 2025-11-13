import { NextRequest, NextResponse } from 'next/server';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';

export async function POST(request: NextRequest) {
  try {
    // ✅ Vérifier l'authentification
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // ✅ S'assurer que le tool est créé pour l'utilisateur authentifié
    const toolData = {
      ...body,
      ownerId: userId, // Forcer l'ownerId à être l'utilisateur connecté
    };
    
    const repository = new PostgresToolRepository();
    const result = await repository.create(toolData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}