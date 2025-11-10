/**
 * Types communs pour toute la feature tools
 */

export type SortKey =
  | "newest"
  | "oldest"
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "brand_asc"
  | "brand_desc"
  | "model_asc"
  | "model_desc"
  | "category_asc"
  | "category_desc";

export interface ToolFilters {
  ownerId?: string;
  categoryId?: number;
  subCategoryId?: number;
  searchQuery?: string;
  sortKey?: SortKey;
  isActive?: boolean;
  limit?: number;
}

export interface ToolFormData {
  title: string;
  description?: string;
  brand?: string;
  model?: string;
  rentalPricePerDay?: number;
  categoryId?: number;
  subCategoryId?: number;
  ownerId: string;
  isActive: boolean;
}


export interface ToolMetadata {
  foreignKeys: Record<string, {
    valueType: "number" | "string";
    options: Array<{ value: any; label: string }>;
  }>;
}

export interface CreateToolResult {
  success: boolean;
  toolId?: string | number;
  error?: string;
  fraudSimilarity?: number;
}

export interface UpdateToolResult {
  success: boolean;
  error?: string;
}

export interface DeleteToolResult {
  success: boolean;
  error?: string;
  notFound?: boolean;
}


