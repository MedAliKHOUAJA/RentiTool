// src/features/Cards/actions/Cards.ts
'use server';

import { createCardSchema, CreateCardFormData } from '@/features/Cards/schemas/Cards';
import { db } from '@/app/api/cards/db';
import { z } from 'zod';

export async function createCard(formData: FormData) {
  try {

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

    const userId = formData.get('userId') as string;

    const cardResult = await db.query(
      `INSERT INTO public."BusinessCards" (
        "UserId", "JobTitle", "CompanyName", "WebSite", "CreatedAt", "UpdatedAt", 
        "QrCodeUrl", "SocialLinks"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6)
      RETURNING "CardId"`,
      [
        userId,
        data.jobTitle,
        data.companyName,
        data.webSite || null,
        null,
        null,
      ]
    );

    if (cardResult.rowCount !== 1) {
      return { success: false, error: 'Échec de l’insertion dans la base de données' };
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


export async function updateCard(cardId: number, formData: FormData) {
  try {
    const data = createCardSchema.parse({
      jobTitle: formData.get('jobTitle') as string,
      companyName: formData.get('companyName') as string,
      webSite: formData.get('webSite') as string | null,
      profilePicture: formData.get('profilePicture') as File | null,
      companyLogo: formData.get('companyLogo') as File | null,
    });

    const userId = (await db.query(
      `SELECT "UserId" FROM public."BusinessCards" WHERE "CardId" = $1`,
      [cardId]
    )).rows[0].UserId;


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
        [buffer, userId, cardId, 1, 'ProfilePicture']
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
        [buffer, userId, cardId, 1, 'CompanyLogo']
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

export async function deleteCard(cardId: number) {
  try {
   
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

export async function getCardsByUserId(userId: string) {
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
       WHERE bc."UserId" = $1`,
      [userId]
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