// src/server/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    firstName: string;
    role: string;
    phone?: string;
  };
}

export const authenticate = async (request: NextRequest): Promise<AuthenticatedRequest> => {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    throw new Error('Non authentifié');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Vérifier que l'utilisateur existe toujours
    const result = await db.query(
      `SELECT "userId", "Email", "FirstName", "RoleId", "Phone" FROM "User" WHERE "userId" = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Utilisateur non trouvé');
    }

    const user = result.rows[0];
    
    return Object.assign(request, {
      user: {
        userId: user.userId,
        email: user.Email,
        firstName: user.FirstName,
        role: user.RoleId,
        phone: user.Phone
      }
    });

  } catch (error) {
    throw new Error('Token invalide');
  }
};

export const requireRole = (roles: string[]) => {
  return async (request: NextRequest) => {
    try {
      const authenticatedRequest = await authenticate(request);
      
      if (!authenticatedRequest.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      if (!roles.includes(authenticatedRequest.user.role)) {
        return NextResponse.json({ 
          error: 'Accès refusé. Rôle insuffisant.' 
        }, { status: 403 });
      }

      return authenticatedRequest;
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Erreur d\'authentification' 
      }, { status: 401 });
    }
  };
};

export const requireAdmin = requireRole(['admin', 'superadmin']);
export const requireUser = requireRole(['user', 'admin', 'superadmin']);

// Fonction utilitaire pour créer une réponse d'erreur
export const createErrorResponse = (message: string, status: number = 400) => {
  return NextResponse.json({ error: message }, { status });
};