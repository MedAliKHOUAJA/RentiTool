import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, testConnection } from '@/db';
//import { db, testConnection } from '@/lib/database';
import { sendEmail, emailTemplates } from '@/lib/resend';
import { validateSignupData, sanitizeInput } from '@/lib/validation';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET non défini');
}

export async function POST(request: NextRequest) {
  console.log('🚀 Début inscription API');
  
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 }
    );
  }
  
  try {
    const body = await request.json();
    console.log('📝 Données reçues:', body);

    // Sanitiser les données d'entrée
    const sanitizedData = {
      firstName: sanitizeInput(body.firstName || ''),
      lastName: sanitizeInput(body.lastName || ''),
      email: sanitizeInput(body.email || '').toLowerCase(),
      phone: sanitizeInput(body.phone || ''),
      password: body.password || '',
      confirmPassword: body.confirmPassword || '',
      userType: body.userType || 'user',
      city: sanitizeInput(body.city || '')
    };

    // Valider les données
    const validation = validateSignupData(sanitizedData);
    if (!validation.isValid) {
      console.log('❌ Validation échouée:', validation.errors);
      return NextResponse.json({ 
        error: 'Données invalides',
        errors: validation.errors 
      }, { status: 400 });
    }

    const { firstName, lastName, email, phone, password, userType } = sanitizedData;

    // Connexion DB et validation unicité email
    await testConnection();

    // Vérifier si email existe
    const existing = await query(
      `SELECT "userId" FROM "User" WHERE "Email" = $1`,
      [email]
    );
    const existingRowCount = typeof existing?.rowCount === 'number' ? existing.rowCount : 0;
    if (existingRowCount > 0) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un userId si non géré par la BD
    const userId = randomUUID();

    // Mapper le userType string vers RoleId numérique conforme au schéma
    const mapUserTypeToRoleId = (type: string): number => {
      switch (type?.toLowerCase()) {
        case 'admin':
          return 1; // Admin
        case 'owner':
          return 2; // Propriétaire
        case 'tenant':
          return 3; // Locataire
        default:
          return 4; // Utilisateur standard
      }
    };

    const roleId = mapUserTypeToRoleId(userType);

    // Insérer l'utilisateur
    const insertResult = await query(
      `INSERT INTO "User" (
        "userId", "FirstName", "LastName", "Email", "Phone", "Password", "RoleId", "LocationId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "userId", "FirstName", "LastName", "Email", "Phone", "RoleId", "LocationId"`,
      [
        userId,
        firstName,
        lastName,
        email,
        phone || null,
        hashedPassword,
        roleId,
        null // Aucune localisation au signup par défaut
      ]
    );

    const newUser = insertResult.rows[0];
    console.log('✅ Utilisateur créé:', newUser.userId);

    // 📧 ENVOI DE L'EMAIL AVEC RESEND
    try {
      console.log('📧 Envoi email Resend à:', email);
      
      const emailTemplate = emailTemplates.welcome(
        newUser.FirstName,
        newUser.Email
      );

      const emailResult = await sendEmail(
        email,
        emailTemplate.subject,
        emailTemplate.html
      );

      if (emailResult.success) {
        console.log('✅ Email Resend envoyé avec succès');
        //console.log('📧 Email ID:', emailResult.data?.id);
      } else {
        console.warn('⚠️ Échec envoi email Resend:', emailResult.error);
        // Continuer même si l'email échoue
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email Resend:', emailError);
      // Continuer même si l'email échoue
    }

    // ... (garder votre logique JWT et réponse existante)

    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès. Un email de bienvenue vous a été envoyé.',
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

    // ... (garder votre logique de cookie)

    console.log('🎉 Inscription terminée avec succès');
    return response;

  } catch (error: any) {
    console.error('❌ Erreur inscription API:', error);
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const message = typeof error?.message === 'string' && error.message.length > 0
      ? error.message
      : 'Erreur interne du serveur';

    return NextResponse.json({ error: message }, { status });
  }
}

// Supprimer l'ancien template HTML qui était dans ce fichier