
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, testConnection } from '@/db';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    console.log('🔍 RESET-PWD - Tentative avec token:', token?.substring(0, 10) + '...');

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token et nouveau mot de passe requis' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 });
    }

    // Vérifier token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { email: string; type: string };
      if (decoded.type !== 'reset') {
        throw new Error('Token invalide');
      }
    } catch (jwtErr) {
      console.log('❌ RESET-PWD - Token invalide/expiré');
      return NextResponse.json({ error: 'Lien expiré ou invalide. Demandez un nouveau lien.' }, { status: 400 });
    }

    await testConnection();

    const cleanEmail = decoded.email.toLowerCase().trim();
    const result = await query(
      `SELECT "userId", "Email" FROM "User" WHERE "Email" = $1`,
      [cleanEmail]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const user = result.rows[0];

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour en DB
    await query(
      `UPDATE "User" SET "Password" = $1 WHERE "Email" = $2`,
      [hashedPassword, cleanEmail]
    );

    console.log('✅ RESET-PWD - Mot de passe mis à jour pour:', cleanEmail);
    return NextResponse.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });

  } catch (err) {
    console.error('💥 Erreur reset-password API:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}