import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const toolId = params.id;
    console.log('GET /api/tools/[id]/image - toolId:', toolId);

    // Try to get primary image for the tool from Images table
    try {
      const imageResult = await query(`
        SELECT "ImageId" 
        FROM "Images" 
        WHERE "ToolId" = $1 AND "IsPrimaryToolImage" = true 
        LIMIT 1
      `, [toolId]);

      if (imageResult.rows.length > 0) {
        const imageId = imageResult.rows[0].ImageId;
        return NextResponse.json({ 
          imageUrl: `/api/images/${imageId}`,
          imageId: imageId 
        });
      }
    } catch (error) {
      console.log('Images table query failed:', error);
    }

    // Try alternative table names
    const alternativeTables = ['images', 'Images', 'public.images', 'public."Images"'];
    
    for (const tableName of alternativeTables) {
      try {
        const imageResult = await query(`
          SELECT "ImageId" 
          FROM ${tableName} 
          WHERE "ToolId" = $1 
          LIMIT 1
        `, [toolId]);

        if (imageResult.rows.length > 0) {
          const imageId = imageResult.rows[0].ImageId;
          return NextResponse.json({ 
            imageUrl: `/api/images/${imageId}`,
            imageId: imageId 
          });
        }
      } catch (error) {
        console.log(`Table ${tableName} not found or error:`, error);
      }
    }

    // No image found
    return NextResponse.json({ 
      imageUrl: null,
      imageId: null 
    });
  } catch (err: any) {
    console.error("/api/tools/[id]/image GET error:", err?.message || err);
    return NextResponse.json({ error: `Failed to fetch tool image: ${err?.message || err}` }, { status: 500 });
  }
}
