// src/features/Cards/services/Cards.ts
import { db } from '@/app/api/cards/db';

export async function getCardsByUserId(userId: string) {
  try {
    const result = await db.query(
      `SELECT 
         bc."CardId", bc."JobTitle", bc."CompanyName", bc."WebSite",
         u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode"
       FROM public."BusinessCards" bc
       JOIN public."User" u ON bc."UserId" = u."userId"
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE bc."UserId" = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return null;
  }
}