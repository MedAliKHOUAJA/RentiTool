export interface ImageItem {
    id: string | number;
    url: string;
    isPrimary: boolean;
  }
  
  interface UploadImageResult {
    success: boolean;
    images?: ImageItem[];
    error?: string;
  }
  
  export async function uploadToolImage(
    toolId: string | number,
    file: File
  ): Promise<UploadImageResult> {
    try {
      const fd = new FormData();
      fd.append("file", file);
  
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images`,
        { method: "POST", body: fd }
      );
  
      if (!res.ok) {
        throw new Error(await res.text());
      }
  
      // Reload images
      const listRes = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images`
      );
      const json = await listRes.json();
  
      return {
        success: true,
        images: Array.isArray(json.images) ? json.images : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload image",
      };
    }
  }
  
  export async function deleteToolImage(
    toolId: string | number,
    imageId: string | number
  ): Promise<UploadImageResult> {
    try {
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images/${encodeURIComponent(
          String(imageId)
        )}`,
        { method: "DELETE" }
      );
  
      if (res.status !== 204 && !res.ok) {
        throw new Error(await res.text());
      }
  
      // Reload images
      const listRes = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images`
      );
      const json = await listRes.json();
  
      return {
        success: true,
        images: Array.isArray(json.images) ? json.images : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete image",
      };
    }
  }
  
  export async function setPrimaryToolImage(
    toolId: string | number,
    imageId: string | number
  ): Promise<UploadImageResult> {
    try {
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images/${encodeURIComponent(
          String(imageId)
        )}`,
        { method: "PUT" }
      );
  
      if (res.status !== 204 && !res.ok) {
        throw new Error(await res.text());
      }
  
      // Reload images
      const listRes = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images`
      );
      const json = await listRes.json();
  
      return {
        success: true,
        images: Array.isArray(json.images) ? json.images : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to set primary image",
      };
    }
  }
  
  export async function getToolImages(
    toolId: string | number
  ): Promise<UploadImageResult> {
    try {
      const res = await fetch(
        `/api/tools/${encodeURIComponent(String(toolId))}/images`
      );
  
      if (!res.ok) {
        throw new Error(await res.text());
      }
  
      const json = await res.json();
  
      return {
        success: true,
        images: Array.isArray(json.images) ? json.images : [],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load images",
      };
    }
  }