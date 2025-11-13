
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

const PROTECTED_ROUTES = [
  '/api/my-reviews',
  '/api/reviews/my-tools',
  '/api/tools/my-tools',
  '/api/tools/create',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Exclure les routes d'images publiques (GET seulement)
  if (pathname.startsWith('/api/images/') && request.method === 'GET') {
    return NextResponse.next();
  }

  // ✅ Protéger les routes d'upload/modification d'images
  if (
    pathname.match(/^\/api\/tools\/[^/]+\/images/) &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')
  ) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  // Vérifier les autres routes protégées
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: [
    '/api/my-reviews/:path*',
    '/api/reviews/my-tools',
    '/api/tools/my-tools',
    '/api/tools/create',
    '/api/tools/:id/images/:path*',
    '/api/images/:path*',
  ],
};