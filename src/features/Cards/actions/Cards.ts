// src/features/Cards/actions/Cards.ts
'use server';

import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { db } from '@/app/api/cards/db';
import { getCurrentUserId } from '@/lib/auth-jwt-server'; // ✅ Import auth function
import { z } from 'zod';

// ✅ NEW: Get current logged-in user
export async function getCurrentUser() {
  try {
    const userId = await getCurrentUserId();
    
    const result = await db.query(
      `SELECT 
         u."userId", u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode"
       FROM public."User" u
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE u."userId" = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
}

// ✅ UPDATED: Use dynamic user ID from JWT
export async function createCard(formData: FormData) {
  try {
    // ✅ Get userId from JWT token instead of formData
    const userId = await getCurrentUserId();

    const formDataObj = Object.fromEntries(formData);
    console.log('Received formData:', formDataObj);
    console.log('Profile Picture raw:', formData.get('profilePicture'), typeof formData.get('profilePicture'));
    console.log('Company Logo raw:', formData.get('companyLogo'), typeof formData.get('companyLogo'));

    const data = createCardSchema.parse({
      jobTitle: formData.get('jobTitle') as string,
      companyName: formData.get('companyName') as string,
      webSite: formData.get('webSite') as string | null,
      profilePicture: formData.get('profilePicture') as File | null,
      companyLogo: formData.get('companyLogo') as File | null,
    });

    const cardResult = await db.query(
      `INSERT INTO public."BusinessCards" (
        "UserId", "JobTitle", "CompanyName", "WebSite", "CreatedAt", "UpdatedAt", 
        "QrCodeUrl", "SocialLinks"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
      RETURNING "CardId"`,
      [
        userId, // ✅ Use dynamic userId
        data.jobTitle,
        data.companyName,
        data.webSite || null,
        null,
        null,
      ]
    );

    if (cardResult.rowCount !== 1) {
      return { success: false, error: 'Échec de linsertion dans la base de données' };
    }

    const cardId = cardResult.rows[0].CardId;

    if (data.profilePicture) {
      const buffer = Buffer.from(await data.profilePicture.arrayBuffer());
      await db.query(
        `INSERT INTO public."Images" (
          "ImageBinary", "UserId", "BusinessCardId", "ClassificationId", "ImageType"
        ) VALUES ($1, $2, $3, $4, $5)`,
        [buffer, userId, cardId, 1, 'ProfilePicture']
      );
    }

    if (data.companyLogo) {
      const buffer = Buffer.from(await data.companyLogo.arrayBuffer());
      await db.query(
        `INSERT INTO public."Images" (
          "ImageBinary", "UserId", "BusinessCardId", "ClassificationId", "ImageType"
        ) VALUES ($1, $2, $3, $4, $5)`,
        [buffer, userId, cardId, 1, 'CompanyLogo']
      );
    }

    return { success: true, cardId };
  } catch (error) {
    console.error('Error creating card:', error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<z.infer<typeof createCardSchema>>;
      return { success: false, error: zodError.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Erreur serveur lors de la création de la carte' };
  }
}

// ✅ UPDATED: Verify ownership before updating
export async function updateCard(cardId: number, formData: FormData) {
  try {
    const currentUserId = await getCurrentUserId();

    // ✅ Verify user owns this card
    const ownerCheck = await db.query(
      `SELECT "UserId" FROM public."BusinessCards" WHERE "CardId" = $1`,
      [cardId]
    );

    if (ownerCheck.rowCount === 0) {
      return { success: false, error: 'Carte non trouvée' };
    }

    const cardOwnerId = ownerCheck.rows[0].UserId;
    
    if (cardOwnerId !== currentUserId) {
      return { success: false, error: 'Non autorisé à modifier cette carte' };
    }

    const data = createCardSchema.parse({
      jobTitle: formData.get('jobTitle') as string,
      companyName: formData.get('companyName') as string,
      webSite: formData.get('webSite') as string | null,
      profilePicture: formData.get('profilePicture') as File | null,
      companyLogo: formData.get('companyLogo') as File | null,
    });

    const cardResult = await db.query(
      `UPDATE public."BusinessCards"
       SET "JobTitle" = $1, "CompanyName" = $2, "WebSite" = $3, 
           "UpdatedAt" = NOW()
       WHERE "CardId" = $4
       RETURNING "CardId"`,
      [
        data.jobTitle,
        data.companyName,
        data.webSite || null,
        cardId,
      ]
    );

    if (cardResult.rowCount !== 1) {
      return { success: false, error: 'Carte non trouvée ou échec de la mise à jour' };
    }

    if (data.profilePicture) {
      const buffer = Buffer.from(await data.profilePicture.arrayBuffer());
      await db.query(
        `DELETE FROM public."Images" WHERE "BusinessCardId" = $1 AND "ImageType" = $2`,
        [cardId, 'ProfilePicture']
      );
      await db.query(
        `INSERT INTO public."Images" (
          "ImageBinary", "UserId", "BusinessCardId", "ClassificationId", "ImageType"
        ) VALUES ($1, $2, $3, $4, $5)`,
        [buffer, currentUserId, cardId, 1, 'ProfilePicture']
      );
    }

    if (data.companyLogo) {
      const buffer = Buffer.from(await data.companyLogo.arrayBuffer());
      await db.query(
        `DELETE FROM public."Images" WHERE "BusinessCardId" = $1 AND "ImageType" = $2`,
        [cardId, 'CompanyLogo']
      );
      await db.query(
        `INSERT INTO public."Images" (
          "ImageBinary", "UserId", "BusinessCardId", "ClassificationId", "ImageType"
        ) VALUES ($1, $2, $3, $4, $5)`,
        [buffer, currentUserId, cardId, 1, 'CompanyLogo']
      );
    }

    return { success: true, cardId };
  } catch (error) {
    console.error('Error updating card:', error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<z.infer<typeof createCardSchema>>;
      return { success: false, error: zodError.issues.map((e: z.ZodIssue) => e.message).join(', ') };
    }
    return { success: false, error: 'Erreur serveur lors de la mise à jour de la carte' };
  }
}

// ✅ UPDATED: Verify ownership before deleting
export async function deleteCard(cardId: number) {
  try {
    const currentUserId = await getCurrentUserId();

    // ✅ Verify user owns this card
    const ownerCheck = await db.query(
      `SELECT "UserId" FROM public."BusinessCards" WHERE "CardId" = $1`,
      [cardId]
    );

    if (ownerCheck.rowCount === 0) {
      return { success: false, error: 'Carte non trouvée' };
    }

    if (ownerCheck.rows[0].UserId !== currentUserId) {
      return { success: false, error: 'Non autorisé à supprimer cette carte' };
    }

    await db.query(
      `DELETE FROM public."Images" WHERE "BusinessCardId" = $1`,
      [cardId]
    );

    const result = await db.query(
      `DELETE FROM public."BusinessCards"
       WHERE "CardId" = $1
       RETURNING "CardId"`,
      [cardId]
    );

    if (result.rowCount === 1) {
      return { success: true, cardId: result.rows[0].CardId };
    }
    return { success: false, error: 'Carte non trouvée ou échec de la suppression' };
  } catch (error) {
    console.error('Error deleting card:', error);
    return { success: false, error: 'Erreur serveur lors de la suppression de la carte' };
  }
}

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

// ✅ UPDATED: Get cards for current user
export async function getCardsByUserId(userId?: string) {
  try {
    // ✅ If no userId provided, get current user
    const targetUserId = userId || await getCurrentUserId();
    
    const result = await db.query(
      `SELECT 
         bc."CardId", bc."JobTitle", bc."CompanyName", bc."WebSite", bc."QrCodeUrl", bc."SocialLinks",
         u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode",
         (SELECT encode("ImageBinary", 'base64') FROM public."Images" 
          WHERE "BusinessCardId" = bc."CardId" AND "ImageType" = 'ProfilePicture' LIMIT 1) AS "ProfilePictureUrl",
         (SELECT encode("ImageBinary", 'base64') FROM public."Images" 
          WHERE "BusinessCardId" = bc."CardId" AND "ImageType" = 'CompanyLogo' LIMIT 1) AS "CompanyLogoUrl"
       FROM public."BusinessCards" bc
       JOIN public."User" u ON bc."UserId" = u."userId"
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE bc."UserId" = $1`,
      [targetUserId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching cards:', error);
    return null;
  }
}

export async function getCardById(cardId: number) {
  try {
    const result = await db.query(
      `SELECT 
         bc."CardId", bc."JobTitle", bc."CompanyName", bc."WebSite", bc."QrCodeUrl", bc."SocialLinks",
         u."FirstName", u."LastName", u."Email", u."Phone",
         l."Governorate", l."Delegation", l."Postalcode",
         (SELECT encode("ImageBinary", 'base64') FROM public."Images" 
          WHERE "BusinessCardId" = bc."CardId" AND "ImageType" = 'ProfilePicture' LIMIT 1) AS "ProfilePictureUrl",
         (SELECT encode("ImageBinary", 'base64') FROM public."Images" 
          WHERE "BusinessCardId" = bc."CardId" AND "ImageType" = 'CompanyLogo' LIMIT 1) AS "CompanyLogoUrl"
       FROM public."BusinessCards" bc
       JOIN public."User" u ON bc."UserId" = u."userId"
       LEFT JOIN public."Locations" l ON u."LocationId" = l."LocationId"
       WHERE bc."CardId" = $1`,
      [cardId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching card:', error);
    return null;
  }
}

// ✅ UPDATED: Save card for current user
export async function saveSharedCard(cardId: number, notes?: string) {
  try {
    const userId = await getCurrentUserId(); // ✅ Get dynamic user
    const card = await getCardById(cardId);
    if (!card) throw new Error('Carte non trouvée');

    const result = await db.query(
      `INSERT INTO public."SharedCards" ("UserId", "BusinessCardId", "IsFavorite", "IsArchived", "Notes", "ReceivedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("UserId", "BusinessCardId") DO UPDATE
       SET "Notes" = $5, "ReceivedAt" = $6
       RETURNING "SharedCardId"`,
      [userId, cardId, false, false, notes || null, new Date().toISOString().split('T')[0]]
    );

    if (result.rowCount === 0) {
      return { success: true, message: 'Carte déjà sauvegardée (mise à jour des notes)' };
    }
    return { success: true, sharedCardId: result.rows[0].SharedCardId };
  } catch (error) {
    console.error('Error saving shared card:', error);
    throw new Error('Erreur serveur lors de la sauvegarde de la carte');
  }
}

// ✅ UPDATED: Get saved cards for current user
export async function getSavedCardsByUserId(userId?: string) {
  try {
    const targetUserId = userId || await getCurrentUserId(); // ✅ Get dynamic user
    
    const result = await db.query(
      `SELECT 
         bc.*,
         sc."IsFavorite",
         sc."IsArchived",
         sc."Notes",
         sc."ReceivedAt"
       FROM public."BusinessCards" bc
       JOIN public."SharedCards" sc ON bc."CardId" = sc."BusinessCardId"
       WHERE sc."UserId" = $1`,
      [targetUserId]
    );
    return result.rows as any[];
  } catch (error) {
    console.error('Error fetching saved cards:', error);
    throw new Error('Erreur lors de la récupération des cartes sauvegardées');
  }
}