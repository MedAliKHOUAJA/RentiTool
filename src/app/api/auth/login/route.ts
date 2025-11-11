// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, testConnection } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔍 LOGIN - Tentative avec:', { 
      email: email?.toLowerCase()?.trim(),
      passwordLength: password?.length 
    });

    if (!email || !password) {
      console.log('❌ LOGIN - Champs manquants');
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    // Vérifier connexion DB
    await testConnection();

    // Récupérer l'utilisateur
    const cleanEmail = email.toLowerCase().trim();
    
    console.log('🔍 LOGIN - Recherche utilisateur avec email:', cleanEmail);
    
    const result = await db.query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Password", "RoleId", "LocationId"
       FROM "User" WHERE "Email" = $1`,
      [cleanEmail]
    );

    console.log('📊 LOGIN - Résultat recherche:', {
      rowCount: result.rowCount,
      userFound: result.rows[0] ? {
        userId: result.rows[0].userId,
        email: result.rows[0].Email,
        hasPassword: !!result.rows[0].Password
      } : 'AUCUN UTILISATEUR'
    });

    if (result.rowCount === 0) {
      console.log('❌ LOGIN - Aucun utilisateur trouvé pour:', cleanEmail);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    const user = result.rows[0];

    // Vérifier si le mot de passe existe
    if (!user.Password) {
      console.log('❌ LOGIN - Utilisateur sans mot de passe:', user.userId);
      return NextResponse.json({ error: 'Compte non configuré. Contactez l\'administrateur.' }, { status: 401 });
    }

    // Comparer mot de passe
    console.log('🔐 LOGIN - Comparaison mot de passe...');
    const isValid = await bcrypt.compare(password, user.Password);
    
    console.log('🔐 LOGIN - Résultat comparaison:', {
      isValid: isValid,
      passwordProvided: `longueur: ${password.length}`,
      passwordStored: `longueur: ${user.Password.length}`
    });

    if (!isValid) {
      console.log('❌ LOGIN - Mot de passe incorrect pour:', cleanEmail);
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    console.log('✅ LOGIN - Connexion réussie pour:', user.Email);

    // Signer JWT
    const token = jwt.sign(
      {
        userId: user.userId,
        email: user.Email,
        firstName: user.FirstName,
        role: user.RoleId,
        phone: user.Phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
        roleId: user.RoleId,
        locationId: user.LocationId
      }
    });

    // Définir le cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 jours
    });

    console.log('✅ Connexion réussie pour:', user.Email);
    return response;

  } catch (err) {
    console.error('💥 Erreur login API:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}