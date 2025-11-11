// src/features/Cards/services/user.ts
import { db } from '@/app/api/cards/db';
import { getCurrentUserId } from '@/lib/auth-jwt-server';

export async function getCurrentUser() {
  try {
    const userId = getCurrentUserId();
    const result = await db.query(
      `SELECT 
         u."userId", u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode"
       FROM public."User" u
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE u."userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// Keep old one for backward compatibility if needed
export async function getUserById(userId: string) {
  try {
    const result = await db.query(
      `SELECT 
         u."userId", u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode"
       FROM public."User" u
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE u."userId" = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}