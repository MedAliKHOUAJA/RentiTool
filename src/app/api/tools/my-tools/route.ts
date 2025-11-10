import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/features/users/application/get-user-id-from-token.service';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { GetMyToolsUseCase } from '@/features/tools/application/use-cases/get-my-tools.use-case';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 [API] GET /api/tools/my-tools');

    const userId = getUserIdFromToken(request);

    if (!userId) {
      console.error('❌ [API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [API] User authentifié:', userId);

    // Use case
    const toolRepository = new PostgresToolRepository();
    const getMyToolsUseCase = new GetMyToolsUseCase(toolRepository);

    const tools = await getMyToolsUseCase.execute(userId);

    console.log('✅ [API] Tools trouvés:', tools.length);

    return NextResponse.json({
      success: true,
      tools,
    });

  } catch (error: any) {
    console.error('❌ [API] Error fetching user tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}