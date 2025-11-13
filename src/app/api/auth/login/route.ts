// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail, emailTemplates } from '@/lib/resend';
import { query, testConnection } from '@/db';

export const runtime = 'nodejs';

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
    
    const result = await query(
      `SELECT "userId", "FirstName", "LastName", "Email", "Password", "RoleId", "LocationId", "Phone"
       FROM public."User" WHERE "Email" = $1`,
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

    // Envoi d'un email de notification de connexion avec géolocalisation IP
    try {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      console.log(`🔍 IP détectée: ${ip}`);  // Log pour tracer l'IP

      // Skip geo si IP locale (dev)
      let locationInfo = 'Localisation inconnue';
      if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
        console.log('⚠️ IP locale détectée – Skip géoloc (test dev).');
      } else {
        // Essai AbstractAPI (avec clé)
        if (process.env.IPGEO_API_KEY) {
          try {
            const geoResponse = await fetch(
              `https://ipgeolocation.abstractapi.com/v1/?api_key=${process.env.IPGEO_API_KEY}&ip_address=${ip}`
            );
            console.log(`🌍 AbstractAPI status: ${geoResponse.status}`);
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              locationInfo = `${geoData.city || 'N/A'}, ${geoData.country || 'N/A'}`;
              console.log(`🌍 Localisation IP (AbstractAPI): ${locationInfo} pour IP ${ip}`);
            } else {
              console.warn(`⚠️ AbstractAPI erreur: ${geoResponse.status} – Fallback sans clé.`);
            }
          } catch (geoErr) {
            console.warn('⚠️ Erreur AbstractAPI:', geoErr);
          }
        } else {
          console.log('ℹ️ Pas de IPGEO_API_KEY – Utilise fallback sans clé.');
        }

        // Fallback sans clé : ipwhois.app (gratuit, 1000 req/jour)
        if (locationInfo === 'Localisation inconnue') {
          try {
            const fallbackResponse = await fetch(`https://ipwhois.app/json/${ip}`);
            console.log(`🌍 Fallback status: ${fallbackResponse.status}`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              locationInfo = `${fallbackData.city || 'N/A'}, ${fallbackData.country || 'N/A'}`;
              console.log(`🌍 Localisation IP (fallback): ${locationInfo} pour IP ${ip}`);
            }
          } catch (fallbackErr) {
            console.warn('⚠️ Erreur fallback geo:', fallbackErr);
          }
        }
      }

      const when = new Date().toLocaleString('fr-FR', { timeZone: 'UTC' });
      const { subject, html } = emailTemplates.loginNotification(
        user.FirstName, 
        user.Email, 
        when, 
        ip, 
        locationInfo  // Passe toujours, même si 'inconnue'
      );
      const result = await sendEmail(user.Email, subject, html);
      if (!result.success) {
        console.warn('⚠️ Échec envoi email login:', result.error);
      } else {
        console.log(`📧 Email de login envoyé à: ${user.Email} | Localisation incluse: ${locationInfo}`);
      }
    } catch (mailErr) {
      console.warn('⚠️ Erreur lors de l’envoi de l’email de login:', mailErr);
    }
    return response;

  } catch (err) {
    console.error('💥 Erreur login API:', err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}