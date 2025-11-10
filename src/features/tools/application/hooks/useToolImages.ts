import { useState, useEffect } from "react";
import { ImageDto } from "../../domain/image";

// Services API pour les images
async function getToolImages(toolId: string | number): Promise<{
  success: boolean;
  images?: ImageDto[];
  error?: string;
}> {
  try {
    console.log('📡 [getToolImages] Fetching images for toolId:', toolId);
    const response = await fetch(`/api/tools/${toolId}/images`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [getToolImages] Error response:', errorData);
      return {
        success: false,
        error: errorData.error || `Failed to fetch images (${response.status})`,
      };
    }

    const data = await response.json();
    console.log('✅ [getToolImages] Images reçues:', data.images);
    
    // ✅ Vérifier que chaque image a bien un imageId
    if (data.images) {
      data.images.forEach((img: any, index: number) => {
        console.log(`   Image ${index}:`, {
          imageId: img.imageId,
          url: img.url,
          isPrimary: img.isPrimary,
        });
        
        if (!img.imageId) {
          console.error(`❌ Image ${index} n'a pas d'imageId!`, img);
        }
      });
    }
    
    return {
      success: true,
      images: data.images || [],
    };
  } catch (error: any) {
    console.error('❌ [getToolImages] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function uploadToolImage(toolId: string | number, file: File): Promise<{
  success: boolean;
  images?: ImageDto[];
  error?: string;
}> {
  try {
    console.log('📤 [uploadToolImage] Uploading for toolId:', toolId, 'file:', file.name);
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/tools/${toolId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [uploadToolImage] Error:', errorData);
      return {
        success: false,
        error: errorData.error || `Failed to upload image (${response.status})`,
      };
    }

    console.log('✅ [uploadToolImage] Upload réussi, rechargement des images...');
    // Après l'upload, recharger toutes les images
    return await getToolImages(toolId);
  } catch (error: any) {
    console.error('❌ [uploadToolImage] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function deleteToolImage(toolId: string | number, imageId: string | number): Promise<{
  success: boolean;
  images?: ImageDto[];
  error?: string;
}> {
  try {
    console.log('🗑️ [deleteToolImage] Deleting imageId:', imageId, 'from toolId:', toolId);
    
    if (!imageId) {
      console.error('❌ [deleteToolImage] imageId is undefined!');
      return {
        success: false,
        error: 'Image ID is required',
      };
    }
    
    const url = `/api/tools/${toolId}/images/${imageId}`;
    console.log('📡 [deleteToolImage] URL:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [deleteToolImage] Error:', errorData);
      return {
        success: false,
        error: errorData.error || `Failed to delete image (${response.status})`,
      };
    }

    console.log('✅ [deleteToolImage] Suppression réussie, rechargement des images...');
    // Après la suppression, recharger toutes les images
    return await getToolImages(toolId);
  } catch (error: any) {
    console.error('❌ [deleteToolImage] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function setPrimaryToolImage(toolId: string | number, imageId: string | number): Promise<{
  success: boolean;
  images?: ImageDto[];
  error?: string;
}> {
  try {
    console.log('⭐ [setPrimaryToolImage] Setting imageId:', imageId, 'as primary for toolId:', toolId);
    
    if (!imageId) {
      console.error('❌ [setPrimaryToolImage] imageId is undefined!');
      return {
        success: false,
        error: 'Image ID is required',
      };
    }
    
    const url = `/api/tools/${toolId}/images/${imageId}`;
    console.log('📡 [setPrimaryToolImage] URL:', url);
    
    const response = await fetch(url, {
      method: 'PUT',
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [setPrimaryToolImage] Error:', errorData);
      return {
        success: false,
        error: errorData.error || `Failed to set primary image (${response.status})`,
      };
    }

    console.log('✅ [setPrimaryToolImage] Mise à jour réussie, rechargement des images...');
    // Après avoir défini l'image primaire, recharger toutes les images
    return await getToolImages(toolId);
  } catch (error: any) {
    console.error('❌ [setPrimaryToolImage] Exception:', error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// Hook personnalisé
export function useToolImages(toolId: string | number | null) {
  const [images, setImages] = useState<ImageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 [useToolImages] useEffect triggered with toolId:', toolId);
    
    if (!toolId) {
      console.log('⚠️ [useToolImages] No toolId, resetting images');
      setImages([]);
      return;
    }

    const load = async () => {
      console.log('📥 [useToolImages] Loading images...');
      setLoading(true);
      setError(null);

      const result = await getToolImages(toolId);

      setLoading(false);

      if (result.success && result.images) {
        console.log('✅ [useToolImages] Images loaded:', result.images.length);
        setImages(result.images);
      } else {
        console.error('❌ [useToolImages] Failed to load:', result.error);
        setError(result.error || 'Failed to load images');
      }
    };

    load();
  }, [toolId]);

  const upload = async (file: File) => {
    console.log('📤 [useToolImages.upload] Called with file:', file.name);
    
    if (!toolId) {
      console.error('❌ [useToolImages.upload] No toolId');
      setError('No tool ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await uploadToolImage(toolId, file);

    setLoading(false);

    if (result.success && result.images) {
      console.log('✅ [useToolImages.upload] Success');
      setImages(result.images);
    } else {
      console.error('❌ [useToolImages.upload] Failed:', result.error);
      setError(result.error || 'Failed to upload image');
    }
  };

  const remove = async (imageId: string | number) => {
    console.log('🗑️ [useToolImages.remove] Called with imageId:', imageId, 'type:', typeof imageId);
    
    if (!toolId) {
      console.error('❌ [useToolImages.remove] No toolId');
      setError('No tool ID provided');
      return;
    }

    if (!imageId) {
      console.error('❌ [useToolImages.remove] imageId is undefined!');
      setError('Invalid image ID');
      return;
    }

    setError(null);

    const result = await deleteToolImage(toolId, imageId);

    if (result.success && result.images) {
      console.log('✅ [useToolImages.remove] Success');
      setImages(result.images);
    } else {
      console.error('❌ [useToolImages.remove] Failed:', result.error);
      setError(result.error || 'Failed to delete image');
    }
  };

  const setPrimary = async (imageId: string | number) => {
    console.log('⭐ [useToolImages.setPrimary] Called with imageId:', imageId, 'type:', typeof imageId);
    
    if (!toolId) {
      console.error('❌ [useToolImages.setPrimary] No toolId');
      setError('No tool ID provided');
      return;
    }

    if (!imageId) {
      console.error('❌ [useToolImages.setPrimary] imageId is undefined!');
      setError('Invalid image ID');
      return;
    }

    setError(null);

    const result = await setPrimaryToolImage(toolId, imageId);

    if (result.success && result.images) {
      console.log('✅ [useToolImages.setPrimary] Success');
      setImages(result.images);
    } else {
      console.error('❌ [useToolImages.setPrimary] Failed:', result.error);
      setError(result.error || 'Failed to set primary image');
    }
  };

  const clearError = () => setError(null);

  // ✅ Log à chaque changement d'images
  useEffect(() => {
    console.log('🔄 [useToolImages] Images state updated:', images.length, 'images');
    images.forEach((img, i) => {
      console.log(`   ${i}:`, { imageId: img.imageId, isPrimary: img.isPrimary });
    });
  }, [images]);

  return {
    images,
    loading,
    error,
    upload,
    remove,
    setPrimary,
    setImages,
    clearError,
  };
}