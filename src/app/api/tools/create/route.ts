import { NextRequest, NextResponse } from 'next/server';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const repository = new PostgresToolRepository();
    const result = await repository.create(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}