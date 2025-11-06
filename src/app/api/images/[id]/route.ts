import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;

    const query = `
      SELECT "ImageBinary"
      FROM "public"."Images"
      WHERE "ImageId" = $1
    `;

    const result = await db.query(query, [imageId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    const imageBinary = result.rows[0].ImageBinary;

    if (!imageBinary) {
      return NextResponse.json(
        { error: 'Image data is empty' },
        { status: 404 }
      );
    }

    // Convertir en Buffer si nécessaire
    const imageBuffer = Buffer.isBuffer(imageBinary) 
      ? imageBinary 
      : Buffer.from(imageBinary);

    // Détecter le type MIME
    const mimeType = detectMimeType(imageBuffer);

    // Retourner l'image directement (pas de JSON!)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

function detectMimeType(buffer: Buffer): string {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  
  return 'image/jpeg';
}