// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, testConnection } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function POST(request: NextRequest) {
  console.log('🚀 Début inscription API');
  
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password, userType } = body;

    console.log('📝 Données reçues:', { firstName, lastName, email, userType });

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Prénom, Nom, Email et Mot de passe requis' },
        { status: 400 }
      );
    }

    // Test connexion BD
    await testConnection();

    // Vérifier si email existe
    const emailCheck = await db.query(
      `SELECT "userId" FROM "User" WHERE "Email" = $1`,
      [email.toLowerCase().trim()]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email déjà utilisé' },
        { status: 409 }
      );
    }

    // Vérifier que les RoleId existent
    const roleId = userType === 'owner' ? 1 : 2;
    const roleCheck = await db.query(
      `SELECT "RoleId" FROM "UserRole" WHERE "RoleId" = $1`,
      [roleId]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Type d\'utilisateur invalide' },
        { status: 400 }
      );
    }

    // Vérifier LocationId par défaut
    const locationCheck = await db.query(
      `SELECT "LocationId" FROM "Locations" WHERE "LocationId" = $1`,
      [1]
    );

    const locationId = locationCheck.rows.length > 0 ? 1 : null;

    // Hasher mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Gérer le téléphone (integer)
    let phoneValue = null;
    if (phone && phone.toString().trim() !== '') {
      const cleanPhone = phone.toString().replace(/\D/g, '');
      phoneValue = cleanPhone ? parseInt(cleanPhone) : null;
    }

    // REQUÊTE COMPLÈTE avec UUID et toutes les colonnes
    console.log('💾 Insertion utilisateur avec UUID...');
    
    let insertQuery, values;

    if (locationId) {
      // Avec LocationId
      insertQuery = `
        INSERT INTO "User" (
          "FirstName", 
          "LastName", 
          "Email", 
          "Phone", 
          "Password", 
          "RoleId",
          "LocationId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          "userId", 
          "FirstName", 
          "LastName", 
          "Email", 
          "Phone", 
          "RoleId",
          "LocationId"
      `;
      values = [
        firstName.trim(),
        lastName.trim(), 
        email.toLowerCase().trim(),
        phoneValue,
        hashedPassword,
        roleId,
        locationId
      ];
    } else {
      // Sans LocationId
      insertQuery = `
        INSERT INTO "User" (
          "FirstName", 
          "LastName", 
          "Email", 
          "Phone", 
          "Password", 
          "RoleId"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          "userId", 
          "FirstName", 
          "LastName", 
          "Email", 
          "Phone", 
          "RoleId",
          "LocationId"
      `;
      values = [
        firstName.trim(),
        lastName.trim(), 
        email.toLowerCase().trim(),
        phoneValue,
        hashedPassword,
        roleId
      ];
    }

    console.log('📋 Exécution requête:', insertQuery);
    const result = await db.query(insertQuery, values);
    
    if (result.rows.length === 0) {
      throw new Error('Aucun utilisateur créé');
    }

    const newUser = result.rows[0];
    console.log('✅ Utilisateur créé avec UUID:', newUser.userId);

    // Token JWT
    const token = jwt.sign(
      { 
        userId: newUser.userId,
        email: newUser.Email,
        roleId: newUser.RoleId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Réponse SUCCÈS
    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        userId: newUser.userId,
        firstName: newUser.FirstName,
        lastName: newUser.LastName,
        email: newUser.Email,
        phone: newUser.Phone,
        roleId: newUser.RoleId,
        locationId: newUser.LocationId
      }
    }, { status: 201 });

    // Cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('💥 ERREUR API:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Cet email existe déjà' },
        { status: 409 }
      );
    }
    
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Erreur de référence - Vérifiez RoleId et LocationId' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur: ' + error.message },
      { status: 500 }
    );
  }
}