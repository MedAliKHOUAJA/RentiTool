// src/features/users/application/get-user-id-from-token.service.ts
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId || null;
  } catch (error) {
    return null;
  }
}
