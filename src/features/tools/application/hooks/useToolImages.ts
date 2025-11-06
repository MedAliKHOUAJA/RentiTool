import { useState, useEffect } from "react";
import {
  uploadToolImage,
  deleteToolImage,
  setPrimaryToolImage,
  getToolImages,
  ImageItem,
} from "../use-cases/upload-tool-image.use-case";

export function useToolImages(toolId: string | number | null) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) return;

    const load = async () => {
      const result = await getToolImages(toolId);
      if (result.success && result.images) {
        setImages(result.images);
      } else {
        setError(result.error || null);
      }
    };

    load();
  }, [toolId]);

  const upload = async (file: File) => {
    if (!toolId) return;

    setLoading(true);
    setError(null);

    const result = await uploadToolImage(toolId, file);

    setLoading(false);

    if (result.success && result.images) {
      setImages(result.images);
    } else {
      setError(result.error || null);
    }
  };

  const remove = async (imageId: string | number) => {
    if (!toolId) return;

    setError(null);

    const result = await deleteToolImage(toolId, imageId);

    if (result.success && result.images) {
      setImages(result.images);
    } else {
      setError(result.error || null);
    }
  };

  const setPrimary = async (imageId: string | number) => {
    if (!toolId) return;

    setError(null);

    const result = await setPrimaryToolImage(toolId, imageId);

    if (result.success && result.images) {
      setImages(result.images);
    } else {
      setError(result.error || null);
    }
  };

  return {
    images,
    loading,
    error,
    upload,
    remove,
    setPrimary,
    setImages,
  };
}