import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, testConnection } from '@/db';
import { sendEmail, emailTemplates } from '@/lib/resend';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';
const RESET_TOKEN_EXPIRY = '1h';  // 1 heure pour le token reset

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log('🔍 FORGOT-PWD - Demande pour:', email?.toLowerCase()?.trim());

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    await testConnection();

    const cleanEmail = email.toLowerCase().trim();
    const result = await query(
      `SELECT "userId", "Email", "FirstName" FROM "User" WHERE "Email" = $1`,
      [cleanEmail]
    );

    if (result.rowCount === 0) {
      console.log('❌ FORGOT-PWD - Aucun utilisateur trouvé pour:', cleanEmail);
      // Ne pas révéler si l'email existe (sécurité)
      return NextResponse.json({ success: true, message: 'Si l\'email existe, un lien a été envoyé.' });
    }

    const user = result.rows[0];

    // Générer token JWT pour reset (avec email et expiry)
    const resetToken = jwt.sign(
      { email: user.Email, type: 'reset' },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRY }
    );

    // Lien de reset (adapte l'URL pour prod)
    const resetUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('🔗 Reset URL générée:', resetUrl);

    // Envoyer email avec template reset
    const { subject, html } = emailTemplates.resetPassword(user.FirstName, resetUrl, user.Email);
    const emailResult = await sendEmail(user.Email, subject, html);

    if (!emailResult.success) {
      console.error('❌ FORGOT-PWD - Échec envoi email:', emailResult.error);
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 });
    }

    console.log('📧 Email reset envoyé à:', user.Email);
    return NextResponse.json({ success: true, message: 'Lien de réinitialisation envoyé à votre email.' });

  } catch (err) {
    console.error('💥 Erreur forgot-password API:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}