import { NextRequest, NextResponse } from 'next/server';
import { PostgresToolRepository } from '@/features/tools/infrastructure/postgres-tool.repository';
import { ToolFilters, SortKey } from '@/features/tools/domain/tool.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortKeyParam = searchParams.get('sortKey') || 'newest';
    const searchQuery = searchParams.get('searchQuery') || '';
    const ownerId = searchParams.get('ownerId');

    // Valider que sortKey est un SortKey valide
    const validSortKeys: SortKey[] = [
      'newest',
      'oldest',
      'title_asc',
      'title_desc',
      'price_asc',
      'price_desc',
      'brand_asc',
      'brand_desc',
      'model_asc',
      'model_desc',
      'category_asc',
      'category_desc'
    ];

    const sortKey: SortKey = validSortKeys.includes(sortKeyParam as SortKey)
      ? (sortKeyParam as SortKey)
      : 'newest';

    const filters: ToolFilters = {
      sortKey,
      searchQuery,
      ownerId: ownerId || undefined,
      isActive: true,
    };

    const repository = new PostgresToolRepository();
    const tools = await repository.findByFilters(filters);

    return NextResponse.json({ success: true, tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const repository = new PostgresToolRepository();
    const tool = await repository.create(body);

    return NextResponse.json({ success: true, tool });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}