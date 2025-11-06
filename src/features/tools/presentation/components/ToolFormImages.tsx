import React from "react";
import { ImageItem } from "../../../tools/application/use-cases/upload-tool-image.use-case";

interface ToolFormImagesProps {
  stagedImages: Array<{ id: string; preview: string }>;
  uploadedImages: ImageItem[];
  uploading: boolean;
  error: string | null;
  onAddImage: (file: File) => void;
  onRemoveStagedImage: (id: string) => void;
  onDeleteImage: (imageId: string | number) => void;
  onSetPrimary: (imageId: string | number) => void;
}

export function ToolFormImages({
  stagedImages,
  uploadedImages,
  uploading,
  error,
  onAddImage,
  onRemoveStagedImage,
  onDeleteImage,
  onSetPrimary,
}: ToolFormImagesProps) {
  return (
    <div className="listingSection__wrap rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Images</h2>
      </div>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Add-image tile */}
        <li className="relative">
          <label
            className={`flex items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed 
            border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-300 cursor-pointer 
            hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${
              uploading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onAddImage(file);
                e.currentTarget.value = "";
              }}
            />
            <div className="flex flex-col items-center gap-1 text-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 opacity-80"
              >
                <path d="M12 16a1 1 0 0 1-1-1V8.41l-2.3 2.3a1 1 0 1 1-1.4-1.42l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.42L13 8.4V15a1 1 0 0 1-1 1Zm-7 2a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h3a1 1 0 1 1 0 2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3a1 1 0 1 1 0-2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5Z" />
              </svg>
              <span>Add image</span>
            </div>
          </label>
        </li>

        {/* Staged previews */}
        {stagedImages.map((s) => (
          <li key={s.id} className="relative group">
            <img
              src={s.preview}
              alt="staged"
              className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
            <span className="absolute top-2 left-2 text-2xs bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-full">
              New
            </span>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
              <button
                type="button"
                onClick={() => onRemoveStagedImage(s.id)}
                className="px-3 py-1.5 text-xs rounded-full bg-red-600 text-white hover:opacity-90"
              >
                Remove
              </button>
            </div>
          </li>
        ))}

        {/* Uploaded images */}
        {uploadedImages.map((img) => (
          <li key={String(img.id)} className="relative group">
            <img
              src={img.url}
              alt="tool"
              className="w-full aspect-square object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
            />
            {img.isPrimary && (
              <span className="absolute top-2 left-2 text-2xs bg-bleu-nuit text-white px-2 py-0.5 rounded-full">
                Primary
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
              <button
                type="button"
                onClick={() => onSetPrimary(img.id)}
                className="px-3 py-1.5 text-xs rounded-full bg-white text-neutral-900 hover:opacity-90"
              >
                Set primary
              </button>
              <button
                type="button"
                onClick={() => onDeleteImage(img.id)}
                className="px-3 py-1.5 text-xs rounded-full bg-red-600 text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}