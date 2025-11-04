// src/app/api/tools/my-tools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { GetToolsByOwnerUseCase } from '@/features/tools/application/get-tools-by-owner.use-case';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const toolRepository = new PostgresToolRepository();
    const getToolsByOwnerUseCase = new GetToolsByOwnerUseCase(toolRepository);

    const tools = await getToolsByOwnerUseCase.execute(userId);

    return NextResponse.json({ success: true, tools });

  } catch (error) {
    console.error('💥 Erreur API /tools/my-tools:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
