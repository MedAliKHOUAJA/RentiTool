import { NextRequest, NextResponse } from 'next/server';
import { validateSignupData } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Test de validation
    const validation = validateSignupData(data);
    
    if (validation.isValid) {
      return NextResponse.json({
        success: true,
        message: 'Données valides'
      });
    } else {
      return NextResponse.json({
        success: false,
        errors: validation.errors
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erreur test validation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}