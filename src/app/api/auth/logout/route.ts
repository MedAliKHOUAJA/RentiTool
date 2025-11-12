// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    console.log('🔄 Tentative de déconnexion...');
    
    // Récupérer les cookies
    const cookieStore = await cookies();
    
    // Créer la réponse
    const response = NextResponse.json({ 
      success: true, 
      message: 'Déconnexion réussie' 
    });
    
    // Supprimer le cookie auth_token
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immédiatement
      path: '/',
    });

    console.log('✅ Déconnexion réussie');
    
    return response;
  } catch (error) {
    console.error('💥 Erreur lors de la déconnexion:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la déconnexion' 
      },
      { status: 500 }
    );
  }
}