// src/app/api/auth/face-setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db, testConnection } from '@/lib/database';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    // Extract token from cookie (since no NextAuth)
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    } catch {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const { embedding } = await request.json(); // Embedding array from frontend
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json({ error: 'Embedding invalide (doit être 128D vector)' }, { status: 400 });
    }

    await testConnection();

    // Update DB: store as JSON string to be compatible with text/jsonb columns
    const embeddingJson = JSON.stringify(embedding);
    await db.query(
      `UPDATE "User" SET "face_embedding" = $1 WHERE "userId" = $2`,
      [embeddingJson, decoded.userId]
    );

    console.log('✅ Face embedding stored for user:', decoded.userId);
    return NextResponse.json({ success: true, message: 'Reconnaissance faciale configurée' });

  } catch (err) {
    console.error('💥 Erreur face-setup API:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}