import { Image } from "@/features/tools/domain/image";

export function getImageUrl(image?: Image): string {
  if (!image) return '/placeholder.png'; // Image par défaut
  return `/api/images/${image.imageId}`;
}

export function getImageUrlsFromArray(images?: Image[]): string[] {
  if (!images || images.length === 0) return [];
  return images.map(img => `/api/images/${img.imageId}`);
}