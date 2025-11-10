import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

interface JWTPayload {
  userId: string;
  email: string;
  roleId?: number;
}

/**
 * Extrait et vérifie le token JWT depuis les cookies de la requête
 * @param request - La requête Next.js
 * @returns L'ID de l'utilisateur authentifié ou null si non authentifié
 */
export function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      console.log('⚠️ Aucun token trouvé dans les cookies');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (!decoded.userId) {
      console.log('⚠️ Token valide mais sans userId');
      return null;
    }

    return decoded.userId;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    return null;
  }
}

/**
 * Extrait les informations complètes de l'utilisateur depuis le token
 * @param request - La requête Next.js
 * @returns Les données de l'utilisateur ou null
 */
export function getUserFromToken(request: NextRequest): JWTPayload | null {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du token:', error);
    return null;
  }
}