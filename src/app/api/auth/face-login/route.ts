import jwt from 'jsonwebtoken';
import { query, testConnection } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const { embedding } = await request.json(); // Embedding from frontend
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
      return NextResponse.json({ error: 'Embedding invalide' }, { status: 400 });
    }

    await testConnection();

    // Find user with embedding
    const result = await query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Password", "RoleId", "LocationId", "Phone", "face_embedding"
       FROM public."User" WHERE "face_embedding" IS NOT NULL`
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Aucun profil facial configuré' }, { status: 401 });
    }

    // Compare embeddings (cosine similarity > 0.6 threshold)
    let matchUser = null;
    for (const user of result.rows) {
      // face_embedding may already be parsed (JSONB) or a string; normalize to number[]
      let storedEmbedding: number[] | null = null;
      const raw = user.face_embedding;
      if (Array.isArray(raw)) {
        storedEmbedding = raw as number[];
      } else if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          storedEmbedding = Array.isArray(parsed) ? parsed as number[] : null;
        } catch (e) {
          console.warn('Failed to parse face_embedding for user', user.Email, e);
        }
      }
      if (!storedEmbedding || storedEmbedding.length !== 128) continue;

      const similarity = cosineSimilarity(embedding, storedEmbedding);
      if (similarity > 0.6) { // Threshold ajustable
        matchUser = user;
        break;
      }
    }

    if (!matchUser) {
      console.log('❌ Face login failed - No match');
      return NextResponse.json({ error: 'Visage non reconnu' }, { status: 401 });
    }

    // Generate JWT (same as regular login)
    const token = jwt.sign(
      {
        userId: matchUser.userId,
        email: matchUser.Email,
        firstName: matchUser.FirstName,
        role: matchUser.RoleId,
        phone: matchUser.Phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        userId: matchUser.userId,
        firstName: matchUser.FirstName,
        lastName: matchUser.LastName,
        email: matchUser.Email,
        roleId: matchUser.RoleId,
        locationId: matchUser.LocationId
      }
    });

    // Set cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    console.log('✅ Face login successful for:', matchUser.Email);
    return response;

  } catch (err) {
    console.error('💥 Erreur face-login API:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Helper: Cosine similarity for embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}