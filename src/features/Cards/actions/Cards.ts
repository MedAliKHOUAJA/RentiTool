'use server';

import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { db } from '@/app/api/cards/db';
import { getCurrentUserId } from '@/lib/auth-jwt-server';
import { z } from 'zod';
import { User } from 'next-auth';

// ✅ Get current logged-in user
export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log('🔄 Appel API /api/auth/me...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour envoyer les cookies
      cache: 'no-store',
    });

    console.log('📊 Réponse API /api/auth/me:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      console.error('❌ Erreur API /api/auth/me:', response.status, response.statusText);
      
      if (response.status === 401) {
        console.log('🔐 Non authentifié - redirection vers login');
        // Vous pouvez rediriger ici ou laisser le composant gérer
        return null;
      }
      
      if (response.status === 404) {
        console.log('❌ Utilisateur non trouvé en base');
        return null;
      }
      
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Données utilisateur récupérées:', data);

    if (!data.success || !data.user) {
      console.error('❌ Format de réponse invalide:', data);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('💥 Erreur getCurrentUser:', error);
    return null;
  }
}
// ✅ FIXED: createCard - NO location handling at all
export async function createCard(formData: FormData) {
  try {
    const userId = await getCurrentUserId();

    const formDataObj = Object.fromEntries(formData);
    console.log('Received formData:', formDataObj);

    // ✅ Parse data WITHOUT address fields
    const data = createCardSchema.parse({
      firstName: formData.get('firstName') as string | null,
      lastName: formData.get('lastName') as string | null,
      email: formData.get('email') as string | null,
      phone: formData.get('phone') as string | null,
      // ✅ REMOVED: governorate, delegation, postalcode
      jobTitle: formData.get('jobTitle') as string,
      companyName: formData.get('companyName') as string,
      webSite: formData.get('webSite') as string | null,
      profilePicture: formData.get('profilePicture') as File | null,
      companyLogo: formData.get('companyLogo') as File | null,
    });

    // ✅ Update User if fields provided and non-empty (NO location update)
    let updateUserFields = [];
    let userParams: any[] = [userId];
    let userParamIndex = 2;

    if (data.firstName && data.firstName.trim()) {
      updateUserFields.push(`"FirstName" = $${userParamIndex++}`);
      userParams.push(data.firstName.trim());
    }
    if (data.lastName && data.lastName.trim()) {
      updateUserFields.push(`"LastName" = $${userParamIndex++}`);
      userParams.push(data.lastName.trim());
    }
    if (data.email && data.email.trim()) {
      updateUserFields.push(`"Email" = $${userParamIndex++}`);
      userParams.push(data.email.trim());
    }
    if (data.phone && data.phone.trim()) {
      updateUserFields.push(`"Phone" = $${userParamIndex++}`);
      userParams.push(parseInt(data.phone.trim(), 10));
    }

    if (updateUserFields.length > 0) {
      await db.query(
        `UPDATE public."User" SET ${updateUserFields.join(', ')} WHERE "userId" = $1`,
        userParams
      );
    }

    // ✅ REMOVED: All location handling - LocationId stays unchanged

    // ✅ Get specialties from formData (AI-enriched)
    const specialtiesRaw = formData.get('specialties') as string | null;
    const specialties = specialtiesRaw ? JSON.parse(specialtiesRaw) : [];

    // ✅ Create Business Card
    const cardResult = await db.query(
      `INSERT INTO public."BusinessCards" (
        "UserId", "JobTitle", "CompanyName", "WebSite", "CreatedAt", "UpdatedAt", 
        "QrCodeUrl", "SocialLinks", "SpecialtiesAndExpertise", "Tags"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
      RETURNING "CardId"`,
      [
        userId,
        data.jobTitle,
        data.companyName,
        data.webSite || null,
        null,
        null,
        specialties.length > 0 ? JSON.stringify(specialties) : null,
        null,
      ]
    );

    if (cardResult.rowCount !== 1) {
      return { success: false, error: 'Échec de l\'insertion dans la base de données' };
    }

    const cardId = cardResult.rows[0].CardId;

    // ✅ Handle images
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
      return {
        success: false,
        error: zodError.issues.map((e: z.ZodIssue) => e.message).join(', '),
      };
    }
    return { success: false, error: 'Erreur serveur lors de la création de la carte' };
  }
}

// ✅ updateCard - supports Tags and Specialties
export async function updateCard(
  cardId: number,
  formData: FormData | { tags?: string[]; specialties?: string[] }
) {
  try {
    const currentUserId = await getCurrentUserId();

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

    let jobTitle, companyName, webSite, profilePicture, companyLogo, tags, specialties;

    if (formData instanceof FormData) {
      const data = createCardSchema.parse({
        jobTitle: formData.get('jobTitle') as string,
        companyName: formData.get('companyName') as string,
        webSite: formData.get('webSite') as string | null,
        profilePicture: formData.get('profilePicture') as File | null,
        companyLogo: formData.get('companyLogo') as File | null,
      });

      jobTitle = data.jobTitle;
      companyName = data.companyName;
      webSite = data.webSite || null;
      profilePicture = data.profilePicture;
      companyLogo = data.companyLogo;
    } else {
      tags = formData.tags;
      specialties = formData.specialties;
    }

    let updateFields = ['"UpdatedAt" = NOW()'];
    let params: any[] = [];
    let paramIndex = 1;

    if (jobTitle) {
      updateFields.push(`"JobTitle" = $${paramIndex++}`);
      params.push(jobTitle);
    }

    if (companyName) {
      updateFields.push(`"CompanyName" = $${paramIndex++}`);
      params.push(companyName);
    }

    if (webSite !== undefined) {
      updateFields.push(`"WebSite" = $${paramIndex++}`);
      params.push(webSite);
    }

    if (specialties) {
      updateFields.push(`"SpecialtiesAndExpertise" = $${paramIndex++}`);
      params.push(JSON.stringify(specialties));
    }

    if (tags) {
      updateFields.push(`"Tags" = $${paramIndex++}`);
      params.push(JSON.stringify(tags));
    }

    params.push(cardId);

    const cardResult = await db.query(
      `UPDATE public."BusinessCards"
       SET ${updateFields.join(', ')}
       WHERE "CardId" = $${paramIndex}
       RETURNING "CardId"`,
      params
    );

    if (cardResult.rowCount !== 1) {
      return { success: false, error: 'Carte non trouvée ou échec de la mise à jour' };
    }

    if (formData instanceof FormData) {
      if (profilePicture) {
        const buffer = Buffer.from(await profilePicture.arrayBuffer());
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

      if (companyLogo) {
        const buffer = Buffer.from(await companyLogo.arrayBuffer());
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
    }

    return { success: true, cardId };
  } catch (error) {
    console.error('Error updating card:', error);
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<z.infer<typeof createCardSchema>>;
      return {
        success: false,
        error: zodError.issues.map((e: z.ZodIssue) => e.message).join(', '),
      };
    }
    return { success: false, error: 'Erreur serveur lors de la mise à jour de la carte' };
  }
}

export async function deleteCard(cardId: number) {
  try {
    const currentUserId = await getCurrentUserId();

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

    await db.query(`DELETE FROM public."Images" WHERE "BusinessCardId" = $1`, [cardId]);

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

export async function getCardsByUserId(userId?: string) {
  try {
    const targetUserId = userId || (await getCurrentUserId());

    const result = await db.query(
      `SELECT 
         bc."CardId", bc."JobTitle", bc."CompanyName", bc."WebSite", bc."QrCodeUrl", bc."SocialLinks",
         bc."SpecialtiesAndExpertise", bc."Tags",
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
         bc."SpecialtiesAndExpertise", bc."Tags",
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

export async function saveSharedCard(cardId: number, notes?: string) {
  try {
    const userId = await getCurrentUserId();
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

export async function getSavedCardsByUserId(userId?: string) {
  try {
    const targetUserId = userId || (await getCurrentUserId());

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