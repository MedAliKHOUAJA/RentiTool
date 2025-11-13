'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rentitool-secret-key-2024';

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    throw new Error('Unauthorized: No auth token');
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!payload.userId) throw new Error('Invalid token: missing userId');
    return payload.userId;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Unauthorized: Invalid token');
  }
}