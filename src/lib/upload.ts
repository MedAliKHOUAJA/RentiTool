// src/lib/upload.ts
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';

// Configuration pour l'upload d'images
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  fileName?: string;
  url?: string;
  error?: string;
  base64?: string;
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux. Maximum 5MB.' };
  }
  
  return { valid: true };
};

export const saveProfileImage = async (file: File, userId: string): Promise<UploadResult> => {
  try {
    // Valider le fichier
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Convertir l'image en base64 pour le stockage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile_${userId}_${uuidv4()}.${fileExtension}`;

    return {
      success: true,
      fileName,
      base64,
      url: `data:${file.type};base64,${base64}`
    };

  } catch (error) {
    console.error('❌ Erreur sauvegarde image:', error);
    return {
      success: false,
      error: 'Erreur lors de la sauvegarde de l\'image'
    };
  }
};

// Fonction utilitaire pour stocker l'image dans la base de données
export const storeImageInDatabase = async (base64Image: string, userId: string): Promise<string> => {
  try {
    // Ici vous pouvez implémenter le stockage dans votre base de données
    // Par exemple, stocker le base64 dans un champ BLOB ou TEXT
    return base64Image;
  } catch (error) {
    console.error('❌ Erreur stockage BDD:', error);
    throw error;
  }
};

export const deleteProfileImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Si c'est une image base64, pas besoin de suppression de fichier
    if (imageUrl.startsWith('data:')) {
      return true;
    }
    
    // Pour les URLs futures, implémenter la suppression appropriée
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    return false;
  }
};