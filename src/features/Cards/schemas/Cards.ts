// src/features/Cards/schemas/Cards.ts
import { z } from 'zod';

export const createCardSchema = z.object({
  // User fields (optional, prefilled, modifiable)
  firstName: z.string().min(1, 'Le prénom est requis').optional(),
  lastName: z.string().min(1, 'Le nom de famille est requis').optional(),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().optional().refine((val) => !val || /^\d{8}$/.test(val), 'Téléphone invalide (8 chiffres)'),
  
  // ✅ REMOVED: governorate, delegation, postalcode - not part of card creation

  // Card fields
  jobTitle: z.string().min(1, 'Le titre professionnel est requis'),
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  webSite: z.string().url().optional().or(z.literal('')),
  profilePicture: z
    .any()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (val === null || val === undefined) return true;
        if (!(val instanceof File)) {
          console.log('Profile Picture is not a File:', val, typeof val);
          return false;
        }
        if (!['image/jpeg', 'image/png'].includes(val.type)) {
          return false;
        }
        if (val.size > 5 * 1024 * 1024) {
          return false;
        }
        return true;
      },
      {
        message: 'un fichier JPEG ou PNG svp, max 5 Mo',
        path: ['profilePicture'],
      }
    ),
  companyLogo: z
    .any()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (val === null || val === undefined) return true;
        if (!(val instanceof File)) {
          console.log('Company Logo is not a File:', val, typeof val);
          return false;
        }
        if (!['image/jpeg', 'image/png'].includes(val.type)) {
          return false;
        }
        if (val.size > 5 * 1024 * 1024) {
          return false;
        }
        return true;
      },
      {
        message: 'un fichier JPEG ou PNG svp, max 5 Mo',
        path: ['companyLogo'],
      }
    ),
});

export type CreateCardFormData = z.infer<typeof createCardSchema>;

export const updateCardTagsSchema = z.object({
  tags: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
});

export type UpdateCardTagsData = z.infer<typeof updateCardTagsSchema>;